import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createGoal, deleteGoal, getGoals } from "@/lib/goals";
import { categories, type Goal } from "@/types/entry";
import { hasSupabase, isOwnerToken } from "@/lib/supabase";

const schema=z.object({title:z.string().trim().min(2).max(120),metric:z.enum(["minutes","count","checklist","streak"]),target:z.number().int().positive(),period:z.enum(["week","month","year","custom"]),category:z.enum(categories).optional(),deadline:z.string().datetime().optional(),isPublic:z.boolean().default(true)});
async function owner(r:NextRequest){const token=r.headers.get("authorization")?.replace(/^Bearer\s+/i,""); return await isOwnerToken(token)||(!hasSupabase()&&Boolean(process.env.ADMIN_KEY&&r.headers.get("x-admin-key")===process.env.ADMIN_KEY));}
export async function GET(){return NextResponse.json(await getGoals());}
export async function POST(request:NextRequest){if(!await owner(request))return NextResponse.json({error:"Owner authentication required."},{status:401});const parsed=schema.safeParse(await request.json());if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0]?.message},{status:400});const goal:Goal={...parsed.data,id:crypto.randomUUID(),current:0,createdAt:new Date().toISOString()};await createGoal(goal);return NextResponse.json(goal,{status:201});}
export async function DELETE(request:NextRequest){if(!await owner(request))return NextResponse.json({error:"Owner authentication required."},{status:401});const id=request.nextUrl.searchParams.get("id");if(!id)return NextResponse.json({error:"Missing goal ID."},{status:400});await deleteGoal(id);return NextResponse.json({success:true});}

