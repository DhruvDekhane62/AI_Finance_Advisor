import { Router, type IRouter } from "express";
import { db, chatMessagesTable, transactionsTable, budgetsTable } from "@workspace/db";
import { SendChatMessageBody } from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";
import { desc, eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/chat/messages", async (req: any, res): Promise<void> => {
  const rows = await db.select().from(chatMessagesTable).where(eq(chatMessagesTable.userId, req.session.userId)).orderBy(chatMessagesTable.createdAt);
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
    .values({ userId: req.session!.userId, role: "user", content: userContent })
    .returning();

  // Gather financial context
  const recentTransactions = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.userId, req.session!.userId))
    .orderBy(desc(transactionsTable.createdAt))
    .limit(20);

  const budgets = await db.select().from(budgetsTable).where(eq(budgetsTable.userId, req.session!.userId));

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

Provide concise, actionable, personalized financial advice. Use Indian Rupee (₹) as currency. Be empathetic, clear, and practical. Keep responses focused and helpful.
IMPORTANT: You MUST strictly answer ONLY questions related to personal finance, money management, budgets, and investments. If the user asks anything outside of finance, you MUST reply exactly with: "I can only answer questions related to personal finance as it is outside of my expertise." and do not provide any other answer.`;

  // Get conversation history
  const history = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.userId, req.session!.userId))
    .orderBy(chatMessagesTable.createdAt)
    .limit(20);

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
  ];

  // Local Mock Agent (Free, no API key required, infinite quota)
  const lowerContent = userContent.toLowerCase();
  let assistantContent = "I can only answer questions related to personal finance as it is outside of my expertise.";

  const financeKeywords = ["budget", "save", "saving", "invest", "money", "expense", "income", "salary", "spend", "rupee", "₹", "finance", "portfolio", "stock", "mutual fund", "loan", "debt"];
  let isFinanceRelated = financeKeywords.some(kw => lowerContent.includes(kw));

  const isMemoryQuery = lowerContent.includes("previous") || lowerContent.includes("last") || lowerContent.includes("before") || lowerContent.includes("what did i");
  
  // Context awareness: if follow-up question
  const pastAssistantMessages = history.filter(m => m.role === "assistant");
  const lastAssistantMsg = pastAssistantMessages.length > 0 ? pastAssistantMessages[pastAssistantMessages.length - 1] : null;

  const standardRejection = "I can only answer questions related to personal finance as it is outside of my expertise.";

  if (!isFinanceRelated && lastAssistantMsg && lastAssistantMsg.content !== standardRejection) {
      isFinanceRelated = true;
      
      // Provide a smart contextual follow-up based on keywords or just a general continuation
      if (lowerContent.includes("safe") || lowerContent.includes("risk")) {
        assistantContent = `When considering safety, Government Bonds, Fixed Deposits (FDs), or Debt Mutual Funds are much safer options than stocks. They provide stable, predictable returns!`;
      } else if (lowerContent.includes("how") || lowerContent.includes("where") || lowerContent.includes("which")) {
        assistantContent = `To act on what we discussed regarding "${lastAssistantMsg.content.substring(0, 30)}...", you can start by exploring low-cost Index Funds via any registered broker, or setting up an automated SIP.`;
      } else {
        assistantContent = `Building on my last point about "${lastAssistantMsg.content.substring(0, 30)}...", the best way forward is to continuously track your expenses and adjust your strategy based on your long-term goals.`;
      }
  }

  if (isMemoryQuery) {
    const pastUserMessages = history.filter(m => m.role === "user");
    const previousUserMsg = pastUserMessages.length > 1 ? pastUserMessages[pastUserMessages.length - 2] : null;
    if (previousUserMsg) {
       assistantContent = `You previously asked: "${previousUserMsg.content}". To follow up on that, your current net savings is ₹${(totalIncome - totalExpenses).toFixed(2)}. Keep focusing on your financial goals!`;
       isFinanceRelated = true;
    } else {
       assistantContent = `This is our first interaction! What financial questions can I help you with?`;
       isFinanceRelated = true;
    }
  } else if (isFinanceRelated && assistantContent === "I can only answer questions related to personal finance as it is outside of my expertise.") {
    if (lowerContent.includes("save") || lowerContent.includes("saving")) {
      assistantContent = `Based on your recent transactions, your total expenses are ₹${totalExpenses.toFixed(2)}. To improve your savings rate, consider the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings. Try reducing discretionary spending like Entertainment or Food & Dining!`;
    } else if (lowerContent.includes("invest")) {
      assistantContent = `Investing is a great way to grow your wealth! Before investing, ensure you have an emergency fund of 3-6 months of expenses. Since your current net savings is ₹${(totalIncome - totalExpenses).toFixed(2)}, you could start a SIP in a low-cost Index Mutual Fund.`;
    } else if (lowerContent.includes("budget")) {
      assistantContent = `You currently have ${budgets.length} active budgets. Tracking your spending is the first step to financial freedom! Make sure you allocate specific limits for categories where you tend to overspend.`;
    } else {
      assistantContent = `That's a great question about your finances. Your current net savings is ₹${(totalIncome - totalExpenses).toFixed(2)}. I recommend closely monitoring your recent expenses and sticking to your budget limits to achieve your financial goals!`;
    }
  }

  const [assistantMsg] = await db
    .insert(chatMessagesTable)
    .values({ userId: req.session!.userId, role: "assistant", content: assistantContent })
    .returning();

  res.json({ ...assistantMsg, createdAt: assistantMsg.createdAt.toISOString() });
});

export default router;
