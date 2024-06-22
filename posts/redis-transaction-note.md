---
title: Redis transaction note
published: true
date: 2024-06-22 21:19:00
tags: redis
description: Problem I've met with redis transaction
image: 
---

## Vấn đề

Có 1 API trả ra quá nhiều lỗi internal server error, mình kiểm tra thì thấy client go của redis hiển thị lỗi nil message, tìm hiểu sâu hơn thì thấy có vẻ như transaction không được thực thi, sau khi đọc lý thuyết lại thì thấy có vài trường hợp transaction không được thực thi và mình cố chứng minh điều đó nhưng ban đầu không được, mang lên github hỏi (https://github.com/redis/rueidis/discussions/571#discussioncomment-9784180), và 1 tuần sau may mắn mình đã tìm ra vấn đề. 

## Redis transaction

Với mô hình single thread, Redis cung cấp tính khả tuần tự hoá (serializable) và tính cô lập (isolation) cho một transaction, để thực thi một transaction, sử dụng cặp lệnh `MULTI` và `EXEC` hoặc `DISCARD` để huỷ, cụ thể:

- `MULTI` : lệnh bắt đầu để chuẩn bị cho một transaction
- Các command cần thực thi, thay vì thực thi ngay lập tức thì Redis sẽ validate và  bỏ vào queue
- `EXEC` : bắt đầu thực thi tất cả các câu lệnh sau câu lệnh trong queue
- `DISCARD` : huỷ bỏ tất cả câu lệnh trong queue và thoát transaction

Với cách hoạt động như trên và mô hình single thread, Redis đảm bảo được tính cô lập của một transaction, câu lệnh đến từ một client khác sẽ **không được thực thi** ở giữa một transaction.

Nghe có vẻ ổn, tuy nhiên một transaction thông thường sẽ có một pattern như `get → compute → set`, input và output của các bước sẽ phụ thuộc lẫn nhau, và chúng ta không thể làm điều này trong Redis 😑, do đó, hành động `get` và `set` sẽ không mang tính `atomic` , giá trị được get ra lúc đầu đã bị thay đổi trước khi bắt đầu thực hiện bước sau. Ở RDBMS, kết quả cuối cùng của trường hợp này sẽ tuỳ thuộc vào mức độ cô lập của một transaction, có thể ghi đè, có thể rollback dữ liệu, tuy nhiên vì độ phức tạp và hiệu năng, Redis không hỗ trợ rollback dữ liệu và cung cấp một cơ chế khác, đó là `CAS: check-and-set`.

### WATCH

Lệnh `WATCH` cho phép Redis theo dõi giá trị một hoặc nhiều key đến lúc nhận được lệnh `EXEC` , như vậy về cơ bản, các lệnh sẽ được gọi theo thứ tự: `WATCH` → `GET COMMAND` → `MULTI` → `COMMAND1` → `COMMAND 2` → … → `EXEC`, khi nhận và thực thi lệnh `EXEC`, Redis sẽ kiểm tra xem giá trị của các key được theo dõi có được thay đổi hay không, nếu có thì transaction sẽ bị aborted và Redis trả về `empty message` với nội dung `_\r\n`, thông thường các client sẽ xử lý message này như một error với `nil message`. 

Khi `EXEC` được gọi hoặc connection được đóng, tất cả các key sẽ được `UNWATCH` .

Như đã đề cập ở đầu bài viết, mình cố chứng minh lý thuyết trên, nhưng không được :v, sau đó bằng cách reproduce lại, mình đã thấy được vấn đề nằm ở lệnh `WATCH` , và **ở bản thân mình 😐😐😐😐😐😐😐😐😐**.

Mình xin trích dẫn docs từ Redis (https://redis.io/docs/latest/develop/interact/transactions/#watch-explained):

> WATCH can be called multiple times. Simply all the WATCH calls will
have the effects to watch for changes starting from the call, up to
the moment EXEC is called. You can also send any number of keys to a
single WATCH call. <br/><br/>
When EXEC is called, all keys are UNWATCHed, regardless of whether
the transaction was aborted or not.  Also when a client connection is
closed, everything gets UNWATCHed. <br/><br/>
It is also possible to use the UNWATCH command (without arguments)
in order to flush all the watched keys. Sometimes this is useful as we
optimistically lock a few keys, since possibly we need to perform a
transaction to alter those keys, but after reading the current content
of the keys we don't want to proceed.  When this happens we just call
UNWATCH so that the connection can already be used freely for new
transactions.

Mình chỉ tập trung vào đoạn đầu tiên mà không đọc kĩ đoạn thứ 3, đoạn đầu tiên làm mình hiểu nhầm lệnh `WATCH` sẽ reset lại state của key được theo dõi, tuy nhiên, theo đoạn thứ 3 và những gì mình test lại, thì trong cùng 1 client connection, nếu gọi nhiều lệnh `WATCH` liên tiếp trên cùng 1 key thì chỉ có lệnh đầu tiên được thực thi. 

Và trùng hợp thay, Redis client mình đang dùng reuse lại connection của những request trước, đơn giản bởi vì thư viện này lưu trữ connection pool trong một array và mặc định, connection đầu tiên được lấy để thực thi rồi được trả lại về pool. Đó là lý do vì sao mình gọi từng API bằng postman thì thấy rất nhiều lỗi 500. 

Ví dụ, từ kết quả của lệnh `MONITOR` của Redis, `connection ID 38900` thực hiện tất cả các transaction được yêu cầu, và bạn có thể thấy có nhiều lệnh `WATCH` liên tiếp nhau, lệnh `WATCH` trước `MULTI-EXEC` không có ý nghĩa nên transaction bị aborted. 

```bash
2024-06-15 14:27:12.811820 [0 172.24.0.1:58706] "ZADD" "watched_key" "INCR" "-1" "127.0.0.1"
2024-06-15 14:27:12.816681 [0 172.24.0.1:58654] "ZREM" "another_key" "127.0.0.1-d9cace95-2a26-4d94-aa24-1a1d2c381a82"
2024-06-15 14:27:12.823212 [0 172.24.0.1:58674] "ZSCORE" "watched_key" "127.0.0.1"
2024-06-15 14:27:12.831299 [0 172.24.0.1:38920] "EVALSHA" "7726c7be95e2a0ed082ec1da1e26b562f5c8903f" "1" "2:127.0.0.1-d9cace95-2a26-4d94-aa24-1a1d2c381a82" "\x84\xa2\x9f\x13\x85\x1c\xe9\\\xcc\a\x82D\xa4\x8a\xd7B\xa8\xbfK\xfd\xe2\x13\xaaX" "1718461637799"
2024-06-15 14:27:12.831648 [0 lua] "GET" "2:127.0.0.1-d9cace95-2a26-4d94-aa24-1a1d2c381a82"
2024-06-15 14:27:12.831702 [0 lua] "DEL" "2:127.0.0.1-d9cace95-2a26-4d94-aa24-1a1d2c381a82"
2024-06-15 14:27:12.831804 [0 172.24.0.1:58650] "EVALSHA" "7726c7be95e2a0ed082ec1da1e26b562f5c8903f" "1" "0:127.0.0.1-d9cace95-2a26-4d94-aa24-1a1d2c381a82" "\x84\xa2\x9f\x13\x85\x1c\xe9\\\xcc\a\x82D\xa4\x8a\xd7B\xa8\xbfK\xfd\xe2\x13\xaaX" "1718461637799"
2024-06-15 14:27:12.831908 [0 lua] "GET" "0:127.0.0.1-d9cace95-2a26-4d94-aa24-1a1d2c381a82"
2024-06-15 14:27:12.831932 [0 lua] "DEL" "0:127.0.0.1-d9cace95-2a26-4d94-aa24-1a1d2c381a82"
2024-06-15 14:27:12.831993 [0 172.24.0.1:58650] "EVALSHA" "7726c7be95e2a0ed082ec1da1e26b562f5c8903f" "1" "1:127.0.0.1-d9cace95-2a26-4d94-aa24-1a1d2c381a82" "\x84\xa2\x9f\x13\x85\x1c\xe9\\\xcc\a\x82D\xa4\x8a\xd7B\xa8\xbfK\xfd\xe2\x13\xaaX" "1718461637799"
2024-06-15 14:27:12.832003 [0 lua] "GET" "1:127.0.0.1-d9cace95-2a26-4d94-aa24-1a1d2c381a82"
2024-06-15 14:27:12.832006 [0 lua] "DEL" "1:127.0.0.1-d9cace95-2a26-4d94-aa24-1a1d2c381a82"
2024-06-15 14:27:12.904419 [0 172.24.0.1:38900] "ZSCORE" "watched_key" "127.0.0.1"
2024-06-15 14:27:12.905439 [0 172.24.0.1:38900] "WATCH" "watched_key"
2024-06-15 14:27:12.906484 [0 172.24.0.1:38900] "ZRANGEBYSCORE" "watched_key" "-inf" "9" "LIMIT" "0" "1"
2024-06-15 14:27:12.907474 [0 172.24.0.1:38900] "ZSCORE" "watched_key" "127.0.0.1"
2024-06-15 14:27:12.908419 [0 172.24.0.1:38900] "MULTI"
2024-06-15 14:27:12.909881 [0 172.24.0.1:38900] "EXEC"
2024-06-15 14:27:12.910860 [0 172.24.0.1:38900] "ZSCORE" "watched_key" "127.0.0.1"
2024-06-15 14:27:13.244464 [0 172.24.0.1:35638] "keys" "turn/origin/*"
2024-06-15 14:27:13.244489 [0 172.24.0.1:35620] "keys" "turn/origin/*"
2024-06-15 14:27:13.244900 [0 172.24.0.1:35634] "keys" "turn/origin/*"
2024-06-15 14:27:13.244920 [0 172.24.0.1:35636] "keys" "turn/origin/*"
2024-06-15 14:27:13.245474 [0 172.24.0.1:35630] "keys" "turn/origin/*"
2024-06-15 14:27:13.804457 [0 172.24.0.1:58674] "ZRANGEBYSCORE" "another_key" "-inf" "1718461633" "LIMIT" "0" "100"
```

→ Vì vậy, chỉ cần `UNWATCH` những key đã được `WATCH` nếu chúng ta không gọi `EXEC` .