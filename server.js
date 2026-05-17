const express=require("express");

const app=express();

app.use(express.json());

app.use(express.static("./"));

app.post("/generate",async(req,res)=>{

try{

const prompt=req.body.prompt;

const finalPrompt=`
너는 VibeSite AI다.

사용자가 설명하면 완전한 웹사이트를 만들어라.

규칙:

1. HTML만 출력
2. style 태그 포함
3. script 태그 포함
4. 설명 금지
5. 모바일 반응형
6. 코드만 출력

사용자 요청:
${prompt}
`;

const response=
await fetch(
`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
{
method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

contents:[
{
parts:[
{
text:finalPrompt
}
]
}
]

})

}
);

const data=
await response.json();

const code=
data?.candidates?.[0]
?.content?.parts?.[0]
?.text
||
"생성 실패";

res.json({
code
});

}catch{

res.json({
code:"오류 발생"
});

}

});

app.post("/deploy",async(req,res)=>{

try{

const code=req.body.code;

const repoName=
"site-"+Date.now();

const headers={

Authorization:
`token ${process.env.GITHUB_TOKEN}`,

"Content-Type":
"application/json"

};

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

await fetch(
`https://api.github.com/repos/${process.env.GITHUB_USERNAME}/${repoName}/contents/index.html`,
{
method:"PUT",

headers,

body:JSON.stringify({

message:"first commit",

content:
Buffer
.from(code)
.toString("base64")

})

}
);

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

res.json({

url:
`https://${process.env.GITHUB_USERNAME}.github.io/${repoName}`

});

}catch(e){

res.json({

url:"배포 실패"

});

}

});

app.listen(
process.env.PORT||3000
);
