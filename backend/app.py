from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os, tempfile

from agents.planner import PlannerAgent
from agents.resource import ResourceAgent
from agents.scheduler import SchedulerAgent
from agents.cost_estimator import CostEstimator
from agents.risk_manager import RiskManager
from core.dependency_graph import DependencyGraph
from core.gantt_chart import generate_gantt

# Initialize Flask FIRST
app = Flask(__name__)
CORS(app)

# temp file for gantt
GANTT_PATH = os.path.join(tempfile.gettempdir(), "gantt.png")

# Home route
@app.route("/")
def home():
    return "Construction Planner Backend Running 🚀"

# Initialize agents
planner = PlannerAgent()
resource = ResourceAgent()
scheduler = SchedulerAgent()
cost_estimator = CostEstimator()
risk_manager = RiskManager()
dep_graph = DependencyGraph()

# Main API
@app.route("/plan", methods=["POST"])
def plan():
    goal = request.json["goal"]

    tasks = planner.run(goal)
    graph = dep_graph.build(tasks)
    dependencies = list(graph.edges())

    valid, delayed = resource.validate(tasks)
    schedule = scheduler.schedule(graph, valid)

    cost_time = cost_estimator.estimate(schedule)
    optimized_schedule = sorted(schedule, key=lambda t: cost_time[t]["days"])

    risk = risk_manager.recover(delayed)

    severity = "Low"
    if len(delayed) >= 2:
        severity = "Medium"
    if len(delayed) >= 4:
        severity = "High"

    generate_gantt(optimized_schedule, cost_time, path=GANTT_PATH)

    return jsonify({
        "goal": goal,
        "tasks": tasks,
        "dependencies": dependencies,
        "valid_tasks": valid,
        "estimates": cost_time,
        "optimized_schedule": optimized_schedule,
        "risk": risk,
        "severity": severity,
        "gantt": "/gantt.png"
    })

@app.route("/gantt.png")
def gantt():
    if not os.path.exists(GANTT_PATH):
        return ("", 204)
    return send_file(GANTT_PATH, mimetype="image/png")

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)