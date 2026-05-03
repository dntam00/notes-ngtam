# notes-ngtam — Static Blog Generator

Blog tĩnh viết bằng Rust. Generator đọc file Markdown từ `posts/`, render HTML bằng templates, và xuất ra static files.

## Cấu trúc project

```
notes-ngtam/
├── generator-rs/        # Rust source code của generator
│   └── src/main.rs      # Toàn bộ logic: parse markdown, render template, preview server
├── templates/           # HTML templates
│   ├── index.template.html   # Trang chủ (danh sách bài viết)
│   ├── posts.template.html   # Template bài viết
│   ├── tags.template.html    # Template trang tag
│   ├── preview.template.html # Template preview (chỉ dùng khi chạy preview server)
│   └── en.template.html      # Template bài viết tiếng Anh
├── posts/               # Markdown source của bài viết
├── tags/                # HTML được sinh ra cho từng tag
├── css/
│   └── new-theme.css    # CSS chính (dùng cho index, posts, tags)
├── js/
├── img/
├── index.html           # Sinh ra từ ./gen posts
├── rss.xml              # Sinh ra từ ./gen posts
├── gen_te               # Binary generator (Linux, đã build sẵn)
├── gen_exe              # Binary generator (bản khác)
└── .env                 # Biến môi trường (RSS_TITLE, DOMAIN_NAME, RSS_DESCRIPTION)
```

## Workflow

### Xem trước bài viết (không cần build lại)
```bash
./gen_te preview
```
Truy cập:
- **Index page**: `http://localhost:3123/index.html`
- **Tag page**: `http://localhost:3123/tags/<tag>.html`
- **Bài viết cụ thể**: `http://localhost:3123/view/<tên-file-không-đuôi>`

> Preview server phục vụ cả static files (index, tags) lẫn render markdown on-the-fly qua `/view/`.

### Sinh lại toàn bộ HTML
```bash
./gen_te posts
```
Lệnh này sinh ra: `index.html`, `posts/*.html`, `tags/*.html`, `rss.xml`.

### Build lại generator (khi sửa Rust code)
```bash
cd generator-rs && cargo build
cd ..
mv generator-rs/target/debug/generator-rs gen_te
```

## Templates

Các placeholder trong template:

| Placeholder | Ý nghĩa |
|---|---|
| `{%title%}` | Tiêu đề bài viết / tag |
| `{%content%}` | Nội dung HTML (render từ Markdown) |
| `{%tags%}` | Div chứa các tag liên quan (class `other-tags`) |
| `{%post_date%}` | Ngày đăng đã format |
| `{%reading_time%}` | Thời gian đọc ước tính |
| `{%tag_badge%}` | Tag đầu tiên (dùng làm badge) |
| `{%subtitle%}` | Mô tả ngắn (nếu có) |
| `{%toc%}` | Table of contents |
| `{%related%}` | Bài viết liên quan |
| `{%meta%}` | Open Graph meta tags |

## Frontmatter của Markdown

```
title: Tiêu đề bài viết
published: true
date: 2026-01-01 00:00:00
description: Mô tả ngắn (hiện dưới tiêu đề và trong danh sách)
tags: java, jvm, golang
language: vi
```

## CSS

Chỉ dùng một file CSS: `css/new-theme.css` cho tất cả trang (index, posts, tags).

CSS cũ (`css/theme.css`) không còn được dùng nữa — chỉ còn trong lịch sử git.

**Các class chính:**
- `.posts-grid` / `.home-list-item` — danh sách bài trên trang chủ
- `.home-item-title`, `.home-date-indicator`, `.home-item-tags` — các phần tử trong mỗi item
- `.prose` — vùng nội dung bài viết
- `.other-tags` / `.topic-tag` — phần tag ở cuối bài / trang tag
- `.post-title`, `.post-meta`, `.post-divider` — header của bài viết
