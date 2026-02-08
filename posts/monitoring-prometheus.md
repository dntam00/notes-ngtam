---
title: Giám sát hệ thống (P1) - Prometheus 
published: false
date: 2025-01-17 03:17:23
tags: golang, monitoring, prometheus
description: Application monitoring
image: 
---

Trong vòng đời của một ứng dụng, vai trò của một lập trình viên không chỉ có DEV, fix bug QA, lên LIVE xong là hết, mà câu chuyện sẽ còn tiếp diễn sau đó, đó là vận hành hệ thống. Nếu may mắn tham gia một dự án đủ lớn, mình tin rằng đây là một giai đoạn có thể mang lại rất nhiều giá trị về mặt kiến thức, kinh nghiệm cho một người lập trình viên.

Vậy ở công ty hiện tại của mình, vận hành bao gồm những gì?
- Giám sát hệ thống, phản hồi, cải tiến các sự cố trên LIVE.
- Nếu dịch vụ là một loại dạng nền tảng (platform), bạn sẽ cần tích hợp với các bên thứ 3.
- Phát triển các tính năng khác,...

Đối với các công ty product, yêu càu đầu tiên đóng vai trò then chốt trong việc đảm bảo hệ thống của bạn hoạt động một cách chính xác, đáng tin cậy,... 

Nhớ lại những ngày sắp lên lại, dự án được chuyển giao tới một sếp rất khó tính ở bên Hàn, buổi họp đầu tiên sếp hỏi toàn vệ cách mà team dự định sẽ vận hành hệ thống sau khi go live, :)). Trong buổi họp, sếp đi từ đầu đến cuối các khía cạnh quan trọng của việc giám sát hệ thống, và luôn hỏi câu nếu lỗi xảy ra ở chỗ này, thì làm sao biết lỗi ở code của mình, code của thư viện, network, hay upstream,...

Vậy chúng ta giám sát cái gì trong hệ thống?
- Hạ tầng: CPU, RAM, Network throughput, Disk, socket,...
- Metric.
- Trace.

Bài đầu tiên này nói về việc sử dụng Prometheus để giám sát các thông số trong hệ thống.

