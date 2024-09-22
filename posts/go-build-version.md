---
title: Application version in Go
published: true
date: 2024-09-22 20:07:00
tags: go, git
description: Application version in Go
image: 
---

Hiện nay, chúng ta có thể thấy CI/CD được áp dụng ở nơi, việc chuẩn hoá các quá trình này bằng các công cụ như Jenkins giúp các lập trình viên giảm thiểu thời gian tích hợp, triển khai phần mềm. Tuy nhiên, không phải lúc nào những pipeline này cũng chạy đúng, team infra có thể viết script không cẩn thận và một ngày đẹp trời ứng dụng của bạn vẫn chạy với code cũ sau nhiều lần bấm deploy trên pipeline :). Để đảm bảo an toàn và tiết kiệm thời gian, có một cách mà nhiều người sử dụng đó là hiển thị tag, commit, thời gian build code khi build source code.

## Git tag, revision

Để lấy được thông tin `tag`, `revision commit` của source code và gán vào các biến môi trường của một bash session, ta có thể dùng các câu lệnh sau đây:

```bash
export GitTags=$(git describe --tags)
export RevVersion=$(git rev-parse --short HEAD)
```

Dòng lệnh sau lấy được thông tin thời gian build code:

```bash
export BuildTime=$(date -u "+%Y%m%d%I%M")
```

## Go

Go cung cấp flag `ldflags` ở quá trình build code để có thể truyền những thông tin cần thiết cho ứng dụng, trường hợp này mình cần truyền `AppVersion`, câu lệnh build như sau:

```bash
go build -ldflags "-X main.AppVersion=$GitTags.$RevVersion.$BuildTime" -o bin/app cmd/app/main.go

```

Ở trong code, bạn chỉ cần khai báo biến tên `AppVersion` là sẽ nhận được những thông tin này:

```go
var AppVersion string

func main() {
	fmt.Println(AppVersion)
}
```

Mọi bước đã xong, khi nào bấm nút pipeline xong là lên kibana hay đâu đó check log thôi :)