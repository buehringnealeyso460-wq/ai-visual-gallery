# 我的 AI 视觉作品馆

这是一个可直接发布到 GitHub Pages 的静态作品集。

## 添加作品

1. 将图片放入 `assets/images/`，小型视频放入 `assets/videos/`。
2. 在 `gallery.json` 的 `items` 数组中添加记录：

```json
{
  "id": "unique-id",
  "title": "作品标题",
  "description": "作品说明",
  "category": "场景",
  "type": "image",
  "src": "assets/images/example.jpg"
}
```

视频把 `type` 改为 `video`。GitHub 不适合保存大型视频，单个 Git 对象硬性上限为 100 MB。
