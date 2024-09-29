---
title: Error checking in Golang 
published: true
date: 2024-09-29 14:54:00
tags: go, coding
description: Error check in Golang
image: 
---

Trong thế giới của ngôn ngữ lập trình Golang, mọi người có thể bắt gặp việc sử dụng `if else` để kiểm tra lỗi ở mọi nơi, kiểu như thế này:

```Go
if err != nil {
	return
}
// do next thing
```

Thường thì `error` trong Go là interface, có bao giờ mọi người tự hỏi khi nào thì `err == nil`? Có phải đơn giản là giá trị của biến bằng `nil` thì câu lệnh kiểm tra đó sẽ đúng? Thực ra mình cũng mặc định là vậy, cho tới một ngày mình gặp bug :|

Nếu chương trình của chúng ta chỉ sử dụng mỗi `error interface` của Go để trả về lỗi thì có thể an tâm sử dụng, tuy nhiên đối với các ứng dụng phức tạp, chúng ta sẽ có nhu cầu tuỳ chỉnh một kiểu mới để có thể lưu trữ thông tin thêm cho lỗi ví dụ `stack trace`, `cause`, `error type`,... và từ đây, vấn đề sẽ xuất hiện nếu chúng ta không thực sự hiểu về interface trong Go.

## Interface

Interface cho phép lập trình viên định nghĩa một tập các hàm mà bất cứ kiểu dữ liệu nào cũng có thể hiện thực, một thực thể interface (instance) nắm giữ giá trị và kiểu dữ liệu của một biến mà nó đang tham chiếu tới. Go định nghĩa cấu trúc dữ liệu để lưu trữ một thực thể interface như sau:

```Go
type iface struct {
	tab  *itab
	data unsafe.Pointer
}

type itab struct {
	inter *interfacetype
	_type *_type
	hash  uint32
	_     [4]byte
	fun   [1]uintptr
}
```

`interfacetype` là kiểu của interface, `_type` là kiểu cụ thể (struct) mà một thực thể interface đang giữ giá trị.

## Custom error type

Như mình đã đề cập ở trên, trong nhiều trường hợp `error interface` không phù hợp với những yêu cầu về nghiệp vụ và kĩ thuật, lúc đó, chúng ta thường định nghĩa một struct để quản lý error và sử dụng chúng trong suốt chương trình, ví dụ:

```Go
type AppError struct {
	code      int
	errorType string
	cause     error
}

func (err *AppError) Error() string {
	return fmt.Sprintf("code: %v, cause: %v", err.code, err.cause)
}
```

## Error assignment

Lúc này, nếu không cần thận, chúng ta có thể khai báo một số hàm trả về kiểu `*AppError` và sử dụng interface `error` để lưu những giá trị này, và từ đó, bug sẽ xảy ra nếu chúng ra kiểm tra error có `nil` hay không. Được đề cập ở phần đầu, cấu trúc dữ liệu được dùng để lưu một thực thể interface gồm 2 phần, giá trị và kiểu của biến. Để một biến interface bằng `nil` (được kiểm tra bằng phép kiểm tra `==`) thì cả 2 phần của nó đều phải `nil`. 

```Go
func checkAssignError() {
	var err error
	err = getErr()
	if err == nil {
		println("nil")
	} else {
		println("not nil")
	}
}

func getErr() *AppError {
	return nil
}
```

Dựa vào kiến thức trên, giá trị được in ra console sẽ là `not nil`. Golang cung cấp gói `reflect` để chúng ta có thể làm việc với những giá trị dynamic lúc chạy chương trình, tiếp tục với đoạn code ở trên, chạy 2 dòng lệnh sau với biến `err`:

```Go
fmt.Println(reflect.TypeOf(err))
fmt.Println(reflect.ValueOf(err).IsNil())

// *main.AppError
// true
```
Kiểu của `error` không phải `nil` mà là kiểu struct `*AppError`.

## Notes

Với kiến thức này, bạn có thể thiết kế code xử lý lỗi một cách nhất quán, tránh những lỗi tìm ẩn và tiết kiệm thời gian debug, đặc biệt khi chương trình của bạn sử dụng các thư viện thứ 3 và sử dụng nhiều high order function, trong Golang thì mình gặp rất nhiều thư viện code theo style HOC, ví dụ `go breaker`, các hàm của `go breaker` sử dụng `error interface`, nếu hàm của bạn sử dụng `custom error type` như `AppError` ở trên thì chắc chắn câu lệnh kiểm tra `err == nil` sẽ sai. Một ví dụ:

```Go
func (cb *CircuitBreaker[T]) Execute(req func() (T, error)) (T, error) {}
```

Để sử dụng hàm này, bạn phải truyền vào một hàm có chữ ký hàm `func() (T, error)`, nếu bạn sử dụng `AppError`, code vẫn biên dịch được do `AppError` là một kiểu hiện thực `error interface`, nhưng hành vi của code sẽ không đúng như mong đợi.