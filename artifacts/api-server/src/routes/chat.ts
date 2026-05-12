import { Router, type IRouter } from "express";
import { db, chatMessagesTable, transactionsTable, budgetsTable } from "@workspace/db";
import { SendChatMessageBody } from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";
import { desc, eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/chat/messages", async (_req, res): Promise<void> => {
  const rows = await db.select().from(chatMessagesTable).orderBy(chatMessagesTable.createdAt);
  res.json(rows.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })));
});

router.post("/chat/messages", async (req, res): Promise<void> => {
  const parsed = SendChatMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userContent = parsed.data.content;

  // Save user message
  const [userMsg] = await db
    .insert(chatMessagesTable)
    .values({ role: "user", content: userContent })
    .returning();

  // Gather financial context
  const recentTransactions = await db
    .select()
    .from(transactionsTable)
    .orderBy(desc(transactionsTable.createdAt))
    .limit(20);

  const budgets = await db.select().from(budgetsTable);

  const totalIncome = recentTransactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);

  const totalExpenses = recentTransactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  const systemPrompt = `You are an expert AI-powered personal finance advisor. You help users manage their finances, analyze spending patterns, and make smart financial decisions.

The user's recent financial data:
- Recent total income: ₹${totalIncome.toFixed(2)}
- Recent total expenses: ₹${totalExpenses.toFixed(2)}
- Net savings: ₹${(totalIncome - totalExpenses).toFixed(2)}
- Number of budgets: ${budgets.length}
- Recent transactions: ${recentTransactions.slice(0, 5).map((t) => `${t.type} ₹${t.amount} for ${t.category} (${t.description})`).join(", ")}

Provide concise, actionable, personalized financial advice. Use Indian Rupee (₹) as currency. Be empathetic, clear, and practical. Keep responses focused and helpful.`;

  // Get conversation history
  const history = await db
    .select()
    .from(chatMessagesTable)
    .orderBy(chatMessagesTable.createdAt)
    .limit(20);

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
  ];

  const completion = await openai.chat.completions.create({
    model: "gpt-5.4",
    max_completion_tokens: 8192,
    messages,
  });

  const assistantContent = completion.choices[0]?.message?.content ?? "I'm sorry, I couldn't generate a response. Please try again.";

  const [assistantMsg] = await db
    .insert(chatMessagesTable)
    .values({ role: "assistant", content: assistantContent })
    .returning();

  res.json({ ...assistantMsg, createdAt: assistantMsg.createdAt.toISOString() });
});

export default router;
