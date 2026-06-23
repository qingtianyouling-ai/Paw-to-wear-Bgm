# Paw to Wear · BGM 曲库

品牌短视频配乐素材库。可搜索、按多维度筛选、区分可商用/需授权。

## 维度筛选

产品线 · 风格流派 · 情绪调性 · 光线色调 · 氛围感受 · 节奏运镜 · 空间场景 · 季节天气 · 主人画像 · 宠物类型 · 宠物气质 · 人物关系

## 本地运行

```bash
python3 -m http.server 8080
# 打开 http://localhost:8080
```

## 添加歌曲

通过 `/music-analyze` skill 分析后自动入库，更新 `data/songs.json` 并推送。
