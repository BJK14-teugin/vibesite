const express = require("express");
const app = express();

app.use(express.json());
app.use(express.static("./"));

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

/* =========================
   AI 생성 (Gemini)
========================= */
app.post("/generate", async (req, res) => {

try {

const prompt = req.body.prompt;

const finalPrompt = `
너는 VibeSites AI다.
완전한 HTML 웹사이트를 생성해라.

규칙:
- HTML만 출력
- style + script 포함
- 설명 금지
- 모바일 대응

요청:
${prompt}
`;

const response = await fetch(
`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
{
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({
contents: [{ parts: [{ text: finalPrompt }] }]
})
}
);

const data = await response.json();

const code =
data?.candidates?.[0]?.content?.parts?.[0]?.text
|| "생성 실패";

res.json({ code });

} catch (e) {
res.json({ code: "AI 오류: " + (e?.message || e) });
}

});


/* =========================
   GitHub 배포
========================= */
app.post("/deploy", async (req, res) => {

try {

const code = req.body.code;

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

/* 3. Pages 활성화 (무시 가능) */
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
   자동 정리 시스템 (핵심)
   - vibesites만 관리
   - 기존 사이트 절대 건드리지 않음
   - 5개 제한 + 7일 삭제
========================= */
async function cleanRepos() {

try {

const repos = await fetch(
`https://api.github.com/user/repos`,
{
headers: {
Authorization: `token ${process.env.GITHUB_TOKEN}`
}
}
).then(r => r.json());

/* 🔥 vibesites만 필터 */
const vibes = repos.filter(r =>
r.name.startsWith("vibesites-")
);

/* =========================
   1. 7일 지난 repo 삭제
========================= */
for (const r of vibes) {

const lastUsed = new Date(r.updated_at).getTime();

if (Date.now() - lastUsed > SEVEN_DAYS) {

await fetch(
`https://api.github.com/repos/${process.env.GITHUB_USERNAME}/${r.name}`,
{
method: "DELETE",
headers: {
Authorization: `token ${process.env.GITHUB_TOKEN}`
}
}
);

}

}

/* =========================
   2. 최대 5개 유지
========================= */
const sorted = vibes.sort((a, b) =>
new Date(a.created_at) - new Date(b.created_at)
);

/* 🔥 핵심: 5개 초과 삭제 */
while (sorted.length > 5) {

const old = sorted.shift();

/* 기존 사이트 보호 조건 */
if (old.name.startsWith("vibesites-")) {

await fetch(
`https://api.github.com/repos/${process.env.GITHUB_USERNAME}/${old.name}`,
{
method: "DELETE",
headers: {
Authorization: `token ${process.env.GITHUB_TOKEN}`
}
}
);

}

}

} catch (e) {
console.log("clean error:", e.message);
}

}

/* 1시간마다 자동 실행 */
setInterval(cleanRepos, 60 * 60 * 1000);


/* =========================
   서버 실행
========================= */
app.listen(process.env.PORT || 3000);
