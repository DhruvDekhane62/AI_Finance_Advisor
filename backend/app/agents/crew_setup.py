"""
CrewAI Setup & Orchestration
Defines the multi-agent system for personal finance advisory.
"""

import os
from crewai import Agent, Task, Crew, Process
from langchain_openai import ChatOpenAI
from langchain.tools import tool

# ── Tools ────────────────────────────────────────────────────────────

@tool("Fetch User Financial Context")
def fetch_user_context(user_id: str) -> str:
    """Fetches the user's current income, expenses, budgets, and risk profile from the database."""
    # In a real tool, we'd query the DB using the user_id.
    # For now, we simulate fetching the aggregated context.
    from app.models import get_db
    from bson import ObjectId
    db = get_db()
    
    # Try fetching real data if possible
    try:
        from app.models.user import get_profile
        profile = get_profile(db, user_id)
        
        all_tx = list(db.transactions.find({"user_id": ObjectId(user_id)}))
        total_income = sum(t["amount"] for t in all_tx if t["type"] == "income")
        total_expenses = sum(t["amount"] for t in all_tx if t["type"] == "expense")
        
        return (f"User ID {user_id} Financial Summary: "
                f"Total Income: {total_income}, Total Expenses: {total_expenses}. "
                f"Profile Details: {profile}")
    except Exception as e:
        return f"Context could not be fetched due to error: {str(e)}"


# ── Agents ───────────────────────────────────────────────────────────

def create_finance_crew(user_id: str, user_prompt: str) -> Crew:
    """Initialize the agents, assign tasks based on the prompt, and return the Crew."""
    
    # Initialize the LLM (Requires OPENAI_API_KEY in .env)
    # If key is missing, fallback to a dummy response in the chat route.
    llm = ChatOpenAI(model="gpt-4o-mini")

    # 1. Expense Analyzer Agent
    expense_analyzer = Agent(
        role="Expense Analyzer",
        goal="Analyze spending patterns and identify areas for cost reduction.",
        backstory="You are a meticulous accountant who hates wasted money. You find subscription leaks, unnecessary splurges, and budgeting flaws.",
        verbose=True,
        allow_delegation=False,
        tools=[fetch_user_context],
        llm=llm
    )

    # 2. Risk Assessor Agent
    risk_assessor = Agent(
        role="Risk Assessor",
        goal="Evaluate financial stability and emergency preparedness.",
        backstory="You are a cautious risk manager. You ensure users have enough emergency funds and aren't drowning in EMI debts.",
        verbose=True,
        allow_delegation=False,
        tools=[fetch_user_context],
        llm=llm
    )

    # 3. Investment Strategist
    investment_strategist = Agent(
        role="Investment Strategist",
        goal="Provide wealth-building strategies and portfolio allocation.",
        backstory="You are a seasoned Wall Street analyst. You build diverse portfolios balancing mutual funds, stocks, and safe deposits based on surplus cash.",
        verbose=True,
        allow_delegation=False,
        tools=[fetch_user_context],
        llm=llm
    )

    # 4. Chief Financial Advisor (Manager)
    chief_advisor = Agent(
        role="Chief Financial Advisor",
        goal="Synthesize insights from all agents to provide a final, cohesive, and personalized recommendation to the user.",
        backstory="You are the ultimate wealth manager. You take input from your specialized team and present it to the client in a clear, actionable, and encouraging manner.",
        verbose=True,
        allow_delegation=True, # Can delegate to other agents
        tools=[fetch_user_context],
        llm=llm
    )

    # ── Tasks ────────────────────────────────────────────────────────────

    task1 = Task(
        description=f"Analyze the user's financial context (User ID: {user_id}) and address their query: '{user_prompt}'. Identify any immediate spending red flags.",
        expected_output="A summary of spending habits and 2-3 immediate cost-saving tips.",
        agent=expense_analyzer
    )

    task2 = Task(
        description=f"Review the risk profile and emergency preparedness for User ID {user_id} in the context of their query: '{user_prompt}'.",
        expected_output="A brief risk assessment (Low/Med/High) and recommendations for debt or emergency funds.",
        agent=risk_assessor
    )

    task3 = Task(
        description=f"Draft an investment and wealth-building strategy for User ID {user_id} based on their surplus, keeping in mind the query: '{user_prompt}'.",
        expected_output="A specific investment allocation plan (e.g., SIPs, FDs, Equity) suitable for the user.",
        agent=investment_strategist
    )

    task4 = Task(
        description=f"Compile the findings from the Expense Analyzer, Risk Assessor, and Investment Strategist. Answer the user's original query directly and holistically: '{user_prompt}'",
        expected_output="A cohesive, Markdown-formatted financial advisory report that directly answers the user's question, incorporating insights from all specialized agents.",
        agent=chief_advisor,
        context=[task1, task2, task3]
    )

    # ── Crew ─────────────────────────────────────────────────────────────

    crew = Crew(
        agents=[expense_analyzer, risk_assessor, investment_strategist, chief_advisor],
        tasks=[task1, task2, task3, task4],
        process=Process.hierarchical,
        manager_llm=llm, # Chief Advisor acts as the manager
        verbose=True
    )

    return crew


def run_finance_crew(user_id: str, user_prompt: str) -> str:
    """Helper to run the crew and catch missing API key errors."""
    if not os.getenv("OPENAI_API_KEY"):
        return ("⚠️ **API Key Missing**\nThe Agentic AI framework requires an OpenAI API key. "
                "Please configure `OPENAI_API_KEY` in the `.env` file to enable multi-agent financial advisory.")
    
    try:
        crew = create_finance_crew(user_id, user_prompt)
        result = crew.kickoff()
        # CrewAI returns a CrewOutput object in newer versions, cast to string
        return str(result)
    except Exception as e:
        return f"An error occurred while processing your request: {str(e)}"
