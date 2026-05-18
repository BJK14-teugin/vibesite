/* =========================
   GitHub 배포
========================= */
app.post("/deploy", async (req, res) => {

try {

const code = req.body.code;

/* 1️⃣ Gemini가 사이트 이름 생성 */
const namePrompt = `
웹사이트 이름 하나 만들어줘.

규칙:
- 영어 소문자
- 짧게 (2~3단어)
- 공백 없이 하이픈 사용
- 예: neon-clicker, dark-game, pixel-world
`;

const nameRes = await fetch(
`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
{
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({
contents: [{ parts: [{ text: namePrompt }] }]
})
}
);

let siteName =
nameRes?.candidates?.[0]?.content?.parts?.[0]?.text
?.trim()
?.replace(/\s/g, "-")
?.toLowerCase();

/* 안전장치 */
if (!siteName) siteName = "site";

/* 2️⃣ repo 이름 생성 */
const repoName =
"vibesites-" + siteName + "-" + Date.now();

const headers = {
Authorization: `token ${process.env.GITHUB_TOKEN}`,
"Content-Type": "application/json"
};

/* 3️⃣ repo 생성 */
await fetch("https://api.github.com/user/repos", {
method: "POST",
headers,
body: JSON.stringify({
name: repoName,
auto_init: true
})
});

/* 4️⃣ index.html 업로드 */
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

/* 5️⃣ Pages 활성화 (무시 가능) */
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

const url =
`https://${process.env.GITHUB_USERNAME}.github.io/${repoName}`;

res.json({
name: siteName,
repo: repoName,
url: url
});

} catch (e) {

res.json({
error: e.message
});

}

});
