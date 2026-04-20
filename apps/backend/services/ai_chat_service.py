import os
import logging
import google.generativeai as genai
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
else:
    logger.warning("GEMINI_API_KEY not set. AI Chatbot will operate in limited mode.")

def get_bitigchi_ai_response(
    symbol: str, 
    message: str, 
    history: List[Dict[str, str]] = [],
    context_data: Optional[Dict] = None
) -> str:
    """
    Generate a response from Bitigchi AI using Gemini.
    Injects real-time stock context into the prompt.
    """
    if not api_key:
        return "I'm sorry, my AI processing unit (Gemini API Key) is not configured yet. Please contact the administrator. But looking at the data, I am optimistic about the market!"

    try:
        model = genai.GenerativeModel("gemini-pro")
        
        # Prepare context-aware system prompt
        context_str = ""
        if context_data:
            price = context_data.get("current_price")
            change = context_data.get("change_pct")
            rsi = context_data.get("rsi")
            analyst = context_data.get("analyst_consensus", "No consensus")
            
            context_str = f"""
            REAL-TIME DATA FOR {symbol}:
            - Price: ${price}
            - 24h Change: {change}%
            - RSI (Technical): {rsi}
            - Analyst Consensus: {analyst}
            """

        system_instruction = f"""
        You are 'Bitigchi AI', a world-class financial analysts and stock advisor. 
        Your tone is professional, insightful, and slightly encouraging but realistic.
        Use the following metadata to help answer the user's specific query about {symbol}.
        {context_str}
        
        RULES:
        1. Never promise guaranteed profits. Always include a small disclaimer if giving heavy advice.
        2. If the user asks about something unrelated to finance or stocks, politely steer them back to Bitigchi's mission.
        3. Be concise but deep.
        4. Focus on the vision of building a community of smart investors.
        """

        # Start chat with history
        chat = model.start_chat(history=[
            {"role": "user" if h["role"] == "user" else "model", "parts": [h["content"]]} 
            for h in history
        ])
        
        full_prompt = f"Regarding {symbol}: {message}"
        response = chat.send_message(f"{system_instruction}\n\nUser Question: {full_prompt}")
        
        return response.text

    except Exception as e:
        logger.error(f"Gemini AI error: {e}")
        return f"I encountered a brain freeze! (Error: {str(e)}). Let's try again in a moment."
