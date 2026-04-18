# 🤝 Contributing to RendClaw

Thanks for wanting to help! Here's how:

## 🐛 Bug Reports

Open an issue with:
- Steps to reproduce
- Expected vs actual behavior
- Render logs if possible

## ✨ Feature Requests

Open an issue describing:
- What you want
- Why it's useful
- How it should work

## 🔧 Pull Requests

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/amazing`
3. Make your changes
4. Test locally with Docker
5. Push and open a PR

## 🧪 Testing

```bash
docker build -t rendclaw-test .
docker run --rm rendclaw-test bash -c "echo 'Build OK'"
curl http://localhost:10000/health
```
