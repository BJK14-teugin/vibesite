const express = require("express");
const app = express();

app.use(express.json());
app.use(express.static("./"));

/* =========================
   1. AI 코드 생성
========================= */
app.post("/generate", async (req, res) => {

try {

const prompt = req.body.prompt;

const finalPrompt = `
너는 VibeSites AI다.
사용자의 요청으로 완전한 HTML 웹사이트를 만들어라.

규칙:
- HTML만 출력
- style, script 포함
- 모바일 반응형
- 설명 금지

요청:
${prompt}
`;

const response = await fetch(
`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
{
method: "POST",
headers: {
"Content-Type": "application/json"
},
body: JSON.stringify({
contents: [
{
parts: [{ text: finalPrompt }]
}
]
})
}
);

const data = await response.json();

const code =
data?.candidates?.[0]?.content?.parts?.[0]?.text
|| "생성 실패";

res.json({ code });

} catch (e) {

res.json({
code: "AI 오류: " + (e?.message || e)
});

}

});


/* =========================
   2. GitHub 배포 (멀티 사이트)
========================= */
app.post("/deploy", async (req, res) => {

try {

const code = req.body.code;

/* 🔥 여러 사이트 생성 */
const repoName = "vibesites-" + Date.now();

const headers = {
Authorization: `token ${process.env.GITHUB_TOKEN}`,
"Content-Type": "application/json"
};

/* 1. repo 생성 */
await fetch(
"https://api.github.com/user/repos",
{
method: "POST",
headers,
body: JSON.stringify({
name: repoName,
auto_init: true
})
}
);

/* 2. index.html 업로드 */
await fetch(
`https://api.github.com/repos/${process.env.GITHUB_USERNAME}/${repoName}/contents/index.html`,
{
method: "PUT",
headers,
body: JSON.stringify({
message: "auto deploy",
content: Buffer.from(code).toString("base64")
})
}
);

/* 3. Pages 활성화 (실패해도 무시) */
try {
await fetch(
`https://api.github.com/repos/${process.env.GITHUB_USERNAME}/${repoName}/pages`,
{
method: "POST",
headers,
body: JSON.stringify({
source: {
branch: "main",
path: "/"
}
})
}
);
} catch (e) {}

/* 결과 URL 반환 */
res.json({
url: `https://${process.env.GITHUB_USERNAME}.github.io/${repoName}`
});

} catch (e) {

res.json({
url: "배포 실패: " + (e?.message || e)
});

}

});


/* =========================
   서버 실행
========================= */
app.listen(process.env.PORT || 3000);
