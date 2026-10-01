import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
let client=null;
try{
  const cfg=await import('./config.js');
  const SUPABASE_URL=cfg.SUPABASE_URL||'';
  const SUPABASE_PUBLISHABLE_KEY=cfg.SUPABASE_PUBLISHABLE_KEY||'';
  if(SUPABASE_URL&&SUPABASE_PUBLISHABLE_KEY) client=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{autoRefreshToken:true,persistSession:true,detectSessionInUrl:true}});
}catch(e){
  // config.js is optional; the game runs locally when it is absent.
}
export function cloudReady(){return !!client;}
export async function ensureAnonymousSession(){
  if(!client)return null;
  const {data,error}=await client.auth.getSession();
  if(error)throw error;
  if(data?.session)return data.session;
  const result=await client.auth.signInAnonymously({options:{data:{display_name:'Player'}}});
  if(result.error)throw result.error;
  return result.data.session;
}
export async function syncProfile({language='en',display_name='Player'}={}){
  if(!client)return null;
  const {data,error}=await client.auth.getUser();
  if(error)throw error;
  if(!data?.user)return null;
  const result=await client.from('players').upsert({id:data.user.id,display_name,language,updated_at:new Date().toISOString()},{onConflict:'id'}).select().single();
  if(result.error)throw result.error;
  return result.data;
}
export async function getPlayerRecords(){
  if(!client)return null;
  await ensureAnonymousSession();
  const {data:userData,error:userError}=await client.auth.getUser();
  if(userError)throw userError;
  const uid=userData?.user?.id;
  if(!uid)return null;
  const [profileRes,speedRes,brainRes]=await Promise.all([
    client.from('players').select('id,display_name,language,golden_apples').eq('id',uid).maybeSingle(),
    client.from('speed_records').select('*').eq('player_id',uid).maybeSingle(),
    client.from('brain_records').select('*').eq('player_id',uid).maybeSingle()
  ]);
  if(profileRes.error)throw profileRes.error;
  if(speedRes.error)throw speedRes.error;
  if(brainRes.error)throw brainRes.error;
  return {profile:profileRes.data,speed:speedRes.data,brain:brainRes.data};
}
export async function getAchievementStats(){
  if(!client)return null;
  await ensureAnonymousSession();
  const {data,error}=await client.rpc('get_player_achievement_stats');
  if(error)throw error;
  return data||null;
}
export async function getAchievements(){
  if(!client)return [];
  await ensureAnonymousSession();
  const {data,error}=await client.from('player_achievements').select('achievement_id,unlocked_at').order('unlocked_at',{ascending:true});
  if(error)throw error; return data||[];
}
export async function claimAchievement(achievementId){
  if(!client)return null;
  await ensureAnonymousSession();
  const {data,error}=await client.rpc('claim_achievement',{p_achievement_id:achievementId});
  if(error)throw error; return data;
}
export async function getInventory(){
  if(!client)return [];
  await ensureAnonymousSession();
  const {data,error}=await client.from('inventory').select('item_id,purchased_at,items(name,item_type,price)').order('purchased_at',{ascending:false});
  if(error)throw error;
  return data||[];
}
export async function purchaseItem(itemId){
  if(!client)return null;
  await ensureAnonymousSession();
  const {data,error}=await client.rpc('purchase_item',{p_item_id:itemId});
  if(error)throw error;
  return data;
}
export async function submitGameSession(payload){
  if(!client)return null;
  await ensureAnonymousSession();
  const {data,error}=await client.rpc('submit_game_session',payload);
  if(error)throw error;
  return data;
}
export { client as supabase };

// v11 Player ID persistence + 5-slot save API (v10 RPC-compatible). Player ID is the cross-browser guest identity;
// anonymous Auth remains available for legacy Phase 2 services.
export async function v10CreatePlayer(playerId, language='en', state={}){
  if(!client)return null;
  const {data,error}=await client.rpc('v10_create_player',{p_player_id:playerId,p_language:language,p_state:state});
  if(error)throw error; return data||null;
}
export async function v10GetPlayer(playerId){
  if(!client)return null;
  const {data,error}=await client.rpc('v10_get_player',{p_player_id:playerId});
  if(error)throw error; return data||null;
}
export async function v10SaveSlot(playerId,slotNo,slotName,state,revision){
  if(!client)return null;
  const {data,error}=await client.rpc('v10_save_slot',{p_player_id:playerId,p_slot_no:slotNo,p_slot_name:slotName,p_state:state,p_revision:revision});
  if(error)throw error; return data||null;
}
