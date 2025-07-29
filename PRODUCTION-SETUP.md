# 🚀 Health Agent Kit - Production Setup Guide

Welcome to the **Health Agent Kit** production environment! This guide will help you run the full-stack application with real backend integration, showing your actual agents, patient generation, and live simulation data.

## 🎯 What You Get

### **Real Backend Integration:**
- ✅ **4 Real AI Agents**: Rule-Based, ML Neural Network, LLM Clinical, Random Baseline
- ✅ **Live Patient Generation**: Using your `PatientGenerator` with clinical distributions
- ✅ **Real Simulation Engine**: Actual episodes running with your `SimulationEngine`
- ✅ **WebSocket Updates**: Live metrics and performance data
- ✅ **Persistent State**: Real agent stats, experiences, and learning progress

### **Beautiful Frontend:**
- ✅ **Linear.app/Apple Design**: Elegant shadcn/ui components
- ✅ **Real-time Dashboard**: Live simulation metrics
- ✅ **Agent Comparison**: Actual performance data
- ✅ **Patient Viewer**: Real clinical profiles
- ✅ **Performance Analytics**: Live charts and monitoring

---

## 🛠️ Quick Start

### **Option 1: One Command (Recommended)**
```bash
npm run start:full
```

### **Option 2: Manual Setup**
```bash
# Terminal 1 - Start API Server
npm run api

# Terminal 2 - Start Frontend  
npm run web
```

### **Option 3: Shell Script**
```bash
./run-full-stack.sh
```

---

## 📋 Step-by-Step Setup

### **1. Install Dependencies**
```bash
npm install
```

### **2. Start the API Server**
```bash
npm run api
```

**Expected Output:**
```
🚀 Initializing Health Agent Kit Framework...
✅ Framework initialized successfully!
📊 Agents created: 4
🏥 Environment: emergency-dept-1
👥 Patient generator ready
🚀 Health Agent Kit API Server running on http://localhost:3002
🌐 WebSocket server ready for real-time updates
```

### **3. Start the Frontend**
```bash
npm run web
```

**Expected Output:**
```
VITE v5.4.19  ready in 97 ms
➜  Local:   http://localhost:3001/
```

### **4. Open Your Browser**
Navigate to: **http://localhost:3001**

---

## 🔍 How to Verify It's Working

### **✅ Connection Status**
- Look for **"Connected"** badge in the top-right corner
- Green badge = Real backend connected
- Red badge = Using mock data

### **✅ Real Agent Data**
1. Go to **"Agents"** tab
2. Click on any agent to see detailed stats
3. Check if patient counts update when you run simulations

### **✅ Live Patient Generation**
1. Go to **"Patients"** tab  
2. Click **"Generate New Patient"**
3. Patient should load from real `PatientGenerator`

### **✅ Real Simulation**
1. Click **"Start"** button in the header
2. Watch episode counter increase
3. See real-time metrics update

---

## 🎮 Using the Real Features

### **🤖 Agent Management**
- **View All Agents**: See your 4 real agents with actual capabilities
- **Agent Details**: Click any agent for detailed performance metrics
- **Real Stats**: Episode counts, total steps, experience counts are real
- **Learning Progress**: ML agent shows actual training progress

### **👥 Patient Generation**
- **Real Clinical Data**: Patients generated using your clinical distributions
- **Filter Options**: Age range, severity, acuity level filtering
- **Medical Accuracy**: Realistic vital signs, conditions, medications
- **Demographics**: Real population-based statistics

### **📊 Live Simulation**
- **Start/Stop/Reset**: Control actual simulation episodes
- **Real-time Updates**: Live metrics via WebSocket
- **Episode Progress**: Watch real episodes complete
- **Performance Tracking**: Actual agent performance data

### **📈 Performance Analytics**
- **Live Metrics**: Real CPU, memory, throughput data
- **Agent Comparison**: Compare actual performance across agents
- **System Health**: Monitor real resource usage
- **Alerts**: Receive real system notifications

---

## 🔧 API Endpoints

The backend exposes these real endpoints:

- `GET /api/health` - Health check
- `GET /api/agents` - List all real agents
- `POST /api/patients/generate` - Generate real patient
- `GET /api/environment` - Environment state
- `POST /api/simulation/start` - Start real simulation
- `GET /api/performance` - Live performance metrics

---

## 🚨 Troubleshooting

### **Problem: "Connection Error" Screen**
**Solution:**
1. Make sure API server is running on port 3002
2. Check terminal for error messages
3. Install missing dependencies: `npm install`

### **Problem: "Disconnected" Badge**
**Solution:**
1. Restart API server: `npm run api`
2. Refresh browser page
3. Check browser console for WebSocket errors

### **Problem: Mock Data Showing**
**Solution:**
1. Verify API server is running
2. Check that port 3002 is not blocked
3. Look for API connection errors in browser console

### **Problem: Simulation Not Starting**
**Solution:**
1. Check API server terminal for errors
2. Ensure agents are properly initialized
3. Try resetting simulation first

---

## 🎯 Key Differences from Mock Version

| Feature | Mock Version | Production Version |
|---------|-------------|-------------------|
| **Agents** | Static fake data | Real agents with learning |
| **Patients** | Random generation | Clinical distributions |
| **Simulation** | UI animations only | Real episodes & training |
| **Metrics** | Static/random numbers | Live performance data |
| **Updates** | Client-side timers | WebSocket real-time |
| **State** | Browser only | Persistent backend |

---

## 🏆 Production Features

### **Real Agent Intelligence**
- **Rule-Based Agent**: Uses actual ESI triage protocols
- **ML Agent**: Learns from episodes with Q-learning
- **LLM Agent**: Clinical reasoning with medical knowledge
- **Random Agent**: True baseline for comparison

### **Clinical Accuracy**
- **Patient Profiles**: Based on real healthcare statistics
- **Vital Signs**: Age-appropriate ranges and abnormal values
- **Conditions**: Realistic comorbidity patterns
- **Demographics**: Population-based distributions

### **Performance Monitoring**
- **Memory Usage**: Real Node.js memory tracking
- **Processing Time**: Actual agent response times
- **Episode Metrics**: Real reward calculations
- **Learning Curves**: Actual training progress

---

## 📞 Support

If you encounter issues:

1. **Check API Health**: Visit http://localhost:3002/api/health
2. **View Logs**: Check both terminal windows for errors
3. **Reset Everything**: Stop both servers and restart
4. **Clear Browser**: Hard refresh (Cmd/Ctrl + Shift + R)

---

**🎉 Enjoy your production Health Agent Kit with real AI agents and clinical simulation!** 