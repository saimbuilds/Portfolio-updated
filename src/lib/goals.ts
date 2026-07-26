import { promises as fs } from "fs";
import path from "path";
import type { Entry, Goal } from "@/types/entry";
import { hasSupabase, supabaseAdmin } from "@/lib/supabase";

const file = path.join(process.cwd(), "data", "goals.json");
const fromRow = (row: Record<string, unknown>): Goal => ({ id:String(row.id), title:String(row.title), metric:row.metric as Goal["metric"], target:Number(row.target), current:Number(row.current), period:row.period as Goal["period"], category:row.category as Goal["category"], deadline:row.deadline ? String(row.deadline) : undefined, isPublic:Boolean(row.is_public), createdAt:String(row.created_at) });
export async function getGoals(includePrivate=false): Promise<Goal[]> {
  if (hasSupabase()) { let query=supabaseAdmin().from("goals").select("*").order("created_at",{ascending:false}); if(!includePrivate) query=query.eq("is_public",true); const {data,error}=await query; if(error) throw error; return (data||[]).map(fromRow); }
  try { const goals=JSON.parse(await fs.readFile(file,"utf8")) as Goal[]; return goals.filter(g=>includePrivate||g.isPublic); } catch { return []; }
}
export async function createGoal(goal: Goal) {
  if (hasSupabase()) {
    const { error } = await supabaseAdmin().from("goals").insert({
      id: goal.id, title: goal.title, metric: goal.metric, target: goal.target,
      current: goal.current, period: goal.period, category: goal.category || null,
      deadline: goal.deadline || null, is_public: goal.isPublic, created_at: goal.createdAt
    });
    if (error) throw error;
  } else {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify([goal, ...(await getGoals(true))], null, 2) + "\n");
  }
}

export async function deleteGoal(id: string) {
  if (hasSupabase()) {
    const { error } = await supabaseAdmin().from("goals").delete().eq("id", id);
    if (error) throw error;
  } else {
    const goals = await getGoals(true);
    const filtered = goals.filter((g) => g.id !== id);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(filtered, null, 2) + "\n");
  }
}



