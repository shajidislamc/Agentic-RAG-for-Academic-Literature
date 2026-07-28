from agent_graph import graph

if __name__ == "__main__":
    query = "Efficient Transformer attention mechanism for long context windows"
    print(f"Launching Agentic RAG Pipline for Topic:\n'{query}'\n" + "="*60)

    initial_state = {"user_query":  query}
    final_state = graph.invoke(initial_state)

    print("\nFINAL ACADEMIC LITERATURE REVIEW\n")
    print(final_state["final_report"])
