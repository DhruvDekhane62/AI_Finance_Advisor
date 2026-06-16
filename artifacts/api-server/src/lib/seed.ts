import { db, transactionsTable, budgetsTable } from "@workspace/db";

export async function seedUserData(userId: number) {
  // Create default budgets
  await db.insert(budgetsTable).values([
    { userId, category: "Housing", limit: 15000, period: "monthly" },
    { userId, category: "Food & Dining", limit: 8000, period: "monthly" },
    { userId, category: "Entertainment", limit: 5000, period: "monthly" },
    { userId, category: "Transportation", limit: 4000, period: "monthly" },
  ]);

  const now = new Date();
  
  // Create randomized realistic transactions spanning the last 30 days
  const transactions = [];
  
  // 1. Salary (Income)
  const salaryDate = new Date(now);
  salaryDate.setDate(1); // 1st of the month
  transactions.push({
    userId,
    type: "income" as const,
    amount: 50000,
    category: "Salary",
    description: "Monthly Salary",
    date: salaryDate.toISOString().split("T")[0],
  });

  // 2. Rent (Expense)
  const rentDate = new Date(now);
  rentDate.setDate(2); // 2nd of the month
  transactions.push({
    userId,
    type: "expense" as const,
    amount: 15000,
    category: "Housing",
    description: "Rent Payment",
    date: rentDate.toISOString().split("T")[0],
  });

  // 3. Various random expenses
  const categories = ["Food & Dining", "Transportation", "Shopping", "Entertainment", "Health & Fitness", "Utilities"];
  const descriptions: Record<string, string[]> = {
    "Food & Dining": ["Swiggy Order", "Zomato", "Grocery Store", "Coffee Shop", "Dinner at Restaurant"],
    "Transportation": ["Uber Ride", "Metro Card Recharge", "Petrol Pump", "Ola Cab"],
    "Shopping": ["Amazon", "Myntra", "Supermarket", "Electronics Store"],
    "Entertainment": ["Netflix Subscription", "Movie Tickets", "Spotify Premium"],
    "Health & Fitness": ["Gym Membership", "Pharmacy", "Doctor Consultation"],
    "Utilities": ["Electricity Bill", "Internet Bill", "Phone Recharge"],
  };

  for (let i = 0; i < 15; i++) {
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const randomDescription = descriptions[randomCategory][Math.floor(Math.random() * descriptions[randomCategory].length)];
    const randomAmount = Math.floor(Math.random() * 2000) + 150; // Between 150 and 2150
    
    const randomDate = new Date(now);
    randomDate.setDate(now.getDate() - Math.floor(Math.random() * 28)); // Within last 28 days
    
    transactions.push({
      userId,
      type: "expense" as const,
      amount: randomAmount,
      category: randomCategory,
      description: randomDescription,
      date: randomDate.toISOString().split("T")[0],
    });
  }

  // Insert all transactions
  await db.insert(transactionsTable).values(transactions);
}
