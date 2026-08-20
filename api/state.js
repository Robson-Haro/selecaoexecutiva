import { get, put } from '@vercel/blob';

const STATE_PATH='shared/selecaoexecutiva-state.json';

export default async function handler(request,response){
  response.setHeader('Cache-Control','no-store, max-age=0');
  response.setHeader('X-Content-Type-Options','nosniff');

  if(request.method==='GET'){
    try{
      const result=await get(STATE_PATH,{access:'private'});
      if(!result||result.statusCode===404)return response.status(200).json({state:null,updatedAt:0});
      if(result.statusCode!==200)return response.status(500).json({error:'Não foi possível carregar os dados.'});
      const text=await new Response(result.stream).text();
      return response.status(200).json(JSON.parse(text));
    }catch(error){
      if(error?.status===404||error?.statusCode===404)return response.status(200).json({state:null,updatedAt:0});
      return response.status(500).json({error:'Não foi possível carregar os dados.'});
    }
  }

  if(request.method==='POST'){
    const body=typeof request.body==='string'?JSON.parse(request.body):request.body;
    if(!body?.state||!Array.isArray(body.state.stages)||body.state.stages.length!==12){
      return response.status(400).json({error:'Estrutura de dados inválida.'});
    }
    const payload={state:body.state,updatedAt:Date.now()};
    await put(STATE_PATH,JSON.stringify(payload),{
      access:'private',
      addRandomSuffix:false,
      allowOverwrite:true,
      contentType:'application/json'
    });
    return response.status(200).json({ok:true,updatedAt:payload.updatedAt});
  }

  response.setHeader('Allow','GET, POST');
  return response.status(405).json({error:'Método não permitido.'});
}