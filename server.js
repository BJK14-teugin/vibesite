const express=require("express");

const app=express();

app.use(express.json());

app.use(express.static("./"));

app.post("/generate",async(req,res)=>{

try{

const prompt=req.body.prompt;

const finalPrompt=`
너는 VibeSite AI다.

사용자가 설명하면:

1.HTML
2.CSS
3.JS

완전한 웹사이트 코드 생성

반드시 하나의 HTML 파일로 출력

style 태그 포함
script 태그 포함

설명 금지
코드만 출력

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

contents:[{
parts:[{
text:finalPrompt
}]
}]

})

});

const data=
await response.json();

res.json({

code:
data
.candidates[0]
.content
.parts[0]
.text

});

}catch(e){

res.json({

code:"오류 발생"

});

}

});

app.listen(
process.env.PORT||3000
);
