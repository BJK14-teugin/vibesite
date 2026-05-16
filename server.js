const express=require("express");

const app=express();

app.use(express.json());

app.use(express.static("./"));

app.post("/generate",async(req,res)=>{

try{

const prompt=req.body.prompt;

const finalPrompt=`
너는 VibeSite AI다.

사용자가 설명하면
완전한 웹사이트 하나를 만들어라.

규칙:

1. HTML 하나만 출력
2. style 태그 안에 CSS 포함
3. script 태그 안에 JS 포함
4. 설명 금지
5. 코드만 출력
6. 모바일 반응형 포함
7. 보기 좋게 제작

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

});

const data=
await response.json();

const code=
data
?.candidates?.[0]
?.content?.parts?.[0]
?.text
||
"생성 실패";

res.json({
code
});

}catch(err){

res.json({
code:"오류:"+err
});

}

});

app.listen(
process.env.PORT||3000);
