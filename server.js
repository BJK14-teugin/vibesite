const express=require("express");

const app=express();

app.use(express.json());
app.use(express.static("./"));

app.post("/generate",async(req,res)=>{

try{

const prompt=req.body.prompt;

const finalPrompt=`
너는 VibeSite AI다.

사용자가 입력하면 완전한 HTML 웹사이트를 만들어라.

규칙:
- HTML만 출력
- style, script 포함
- 설명 금지
- 모바일 반응형

요청:
${prompt}
`;

const response=await fetch(
`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
contents:[
{
parts:[{text:finalPrompt}]
}
]
})
}
);

const data=await response.json();

const code=
data?.candidates?.[0]?.content?.parts?.[0]?.text
||"생성 실패";

res.json({code});

}catch(e){

res.json({
code:"AI 오류: "+(e?.message||e)
});

}

});

app.post("/deploy",async(req,res)=>{

try{

const code=req.body.code;

// 🔥 고정 repo (중요)
const repoName="vibesite-project";

const headers={
Authorization:`token ${process.env.GITHUB_TOKEN}`,
"Content-Type":"application/json"
};

// 1. repo 생성 (이미 있으면 실패 OK)
await fetch(
"https://api.github.com/user/repos",
{
method:"POST",
headers,
body:JSON.stringify({
name:repoName,
auto_init:true
})
}
);

// 2. index.html 업로드
await fetch(
`https://api.github.com/repos/${process.env.GITHUB_USERNAME}/${repoName}/contents/index.html`,
{
method:"PUT",
headers,
body:JSON.stringify({
message:"update site",
content:Buffer.from(code).toString("base64")
})
}
);

// 3. Pages 활성화 (실패해도 무시)
try{
await fetch(
`https://api.github.com/repos/${process.env.GITHUB_USERNAME}/${repoName}/pages`,
{
method:"POST",
headers,
body:JSON.stringify({
source:{
branch:"main",
path:"/"
}
})
}
);
}catch(e){}

res.json({
url:`https://${process.env.GITHUB_USERNAME}.github.io/${repoName}`
});

}catch(e){

res.json({
url:"배포 실패: "+(e?.message||e)
});

}

});

app.listen(process.env.PORT||3000);
