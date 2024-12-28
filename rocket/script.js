// 初始化图表
const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
        x: {
            title: { 
                display: true, 
                text: '时间 (s)',
                font: {
                    size: 14
                }
            },
            ticks: {
                callback: function(value) {
                    return value.toFixed(1);
                },
                font: {
                    size: 12
                }
            }
        },
        y: { 
            title: { 
                display: true, 
                text: '高度 (m)',
                font: {
                    size: 14
                }
            },
            ticks: {
                font: {
                    size: 12
                }
            }
        }
    },
    plugins: {
        zoom: {
            zoom: {
                wheel: {
                    enabled: true,
                },
                pinch: {
                    enabled: true
                },
                mode: 'xy'
            },
            pan: {
                enabled: true,
                mode: 'xy'
            }
        },
        legend: {
            labels: {
                font: {
                    size: 14,
                    weight: 'bold'
                },
                boxWidth: 20,
                padding: 10
            }
        },
        title: {
            display: true,
            text: '火箭着陆数据',
            font: {
                size: 16,
                weight: 'bold'
            },
            padding: {
                top: 10,
                bottom: 20
            }
        }
    }
};

const heightChart = new Chart(document.getElementById('heightChart'), {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            {
                label: '实际高度 (m)',
                borderColor: '#1a73e8',
                data: []
            },
            {
                label: '目标高度 (m)',
                borderColor: '#ea4335',
                borderDash: [5, 5],
                data: []
            }
        ]
    },
    options: chartOptions
});

const velocityChart = new Chart(document.getElementById('velocityChart'), {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            {
                label: '实际速度 (m/s)',
                borderColor: '#34a853',
                data: []
            },
            {
                label: '目标速度 (m/s)',
                borderColor: '#fbbc05',
                borderDash: [5, 5],
                data: []
            }
        ]
    },
    options: {
        ...chartOptions,
        scales: {
            ...chartOptions.scales,
            y: { title: { display: true, text: '速度 (m/s)' } }
        }
    }
});

const thrustChart = new Chart(document.getElementById('thrustChart'), {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: '推力 (N)',
            borderColor: '#fbbc05',
            data: []
        }]
    },
    options: {
        ...chartOptions,
        scales: {
            ...chartOptions.scales,
            y: { title: { display: true, text: '推力 (N)' } }
        }
    }
});

const accelerationChart = new Chart(document.getElementById('accelerationChart'), {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: '加速度 (m/s²)',
            borderColor: '#ea4335',
            data: []
        }]
    },
    options: {
        ...chartOptions,
        scales: {
            ...chartOptions.scales,
            y: { title: { display: true, text: '加速度 (m/s²)' } }
        }
    }
});

// 火箭动画
const rocket = document.getElementById('rocket');
const rocketContainer = document.getElementById('rocket-container');
const statusDisplay = document.getElementById('status-display');

// 获取DOM元素
const kpInput = document.getElementById('kp');
const kiInput = document.getElementById('ki');
const kdInput = document.getElementById('kd');
const initialHeightInput = document.getElementById('initial_height');
const initialVelocityInput = document.getElementById('initial_velocity');
const targetVelocityInput = document.getElementById('target_velocity');
const timeStepInput = document.getElementById('time_step');
const simTimeInput = document.getElementById('sim_time');
const maxThrustInput = document.getElementById('max_thrust');
const startButton = document.getElementById('start-simulation');

// 模拟配置
let config = {
    kp: 3311,
    ki: 88,
    kd: 12,
    time_step: 0.1,
    sim_time: 49,
    max_thrust: 3000,
    initial_height: 300,
    initial_velocity: -30,
    target_velocity: -2,
    max_integral: 50,
    noise_amplitude: 0.05,
    rocket_mass: 100
};

// 初始化输入框值
kpInput.value = config.kp;
kiInput.value = config.ki;
kdInput.value = config.kd;
initialHeightInput.value = config.initial_height;
initialVelocityInput.value = config.initial_velocity;
targetVelocityInput.value = config.target_velocity;
timeStepInput.value = config.time_step;
simTimeInput.value = config.sim_time;
maxThrustInput.value = config.max_thrust;

// 开始模拟按钮点击事件
startButton.addEventListener('click', () => {
    // 更新配置
    config.kp = parseFloat(kpInput.value);
    config.ki = parseFloat(kiInput.value);
    config.kd = parseFloat(kdInput.value);
    config.initial_height = parseFloat(initialHeightInput.value);
    config.initial_velocity = parseFloat(initialVelocityInput.value);
    config.target_velocity = parseFloat(targetVelocityInput.value);
    config.time_step = parseFloat(timeStepInput.value);
    config.sim_time = parseFloat(simTimeInput.value);
    config.max_thrust = parseFloat(maxThrustInput.value);

    // 重置模拟
    frame = 0;
    simulationData.t = [];
    simulationData.height = [];
    simulationData.velocity = [];
    simulationData.thrust = [];
    simulationData.acceleration = [];
    simulationData.target_trajectory = [];
    simulationData.target_velocity_trajectory = [];

    // 运行模拟
    runSimulation();
});

function animateRocket(height) {
    const maxHeight = rocketContainer.clientHeight;
    const rocketHeight = rocket.clientHeight;
    const normalizedHeight = (height / config.initial_height) * (maxHeight - rocketHeight);
    
    gsap.to(rocket, {
        duration: 0.1,
        bottom: Math.min(normalizedHeight, maxHeight - rocketHeight),
        ease: 'none'
    });
}

function updateStatus(time, height, velocity) {
    statusDisplay.innerHTML = `
        时间: ${time.toFixed(1)}s<br>
        高度: ${height.toFixed(1)}m<br>
        速度: ${velocity.toFixed(1)}m/s
    `;
}

// 模拟数据
let simulationData = {
    t: [],
    height: [],
    velocity: [],
    thrust: [],
    acceleration: [],
    target_trajectory: [],
    target_velocity_trajectory: []
};

function updateCharts() {
    const { t, height, velocity, thrust, acceleration, target_trajectory, target_velocity_trajectory } = simulationData;
    
    // 更新高度图表
    heightChart.data.labels = t;
    heightChart.data.datasets[0].data = height;
    heightChart.data.datasets[1].data = target_trajectory;
    heightChart.update();
    
    // 更新速度图表
    velocityChart.data.labels = t;
    velocityChart.data.datasets[0].data = velocity;
    velocityChart.data.datasets[1].data = target_velocity_trajectory;
    velocityChart.update();
    
    // 更新推力图表
    thrustChart.data.labels = t;
    thrustChart.data.datasets[0].data = thrust;
    thrustChart.update();
    
    // 更新加速度图表
    accelerationChart.data.labels = t;
    accelerationChart.data.datasets[0].data = acceleration;
    accelerationChart.update();
}

// 模拟循环
let frame = 0;
const interval = 50;

// 计算理想轨迹
function calculateIdealTrajectory(t, initialHeight, initialVelocity) {
    // 计算着陆时间T
    // 由于速度是抛物线，其积分（位移）必须等于初始高度
    // 设速度曲线为：v(t) = at² + bt + c
    // 其中：
    // c = initialVelocity (负值)
    // t=T时，v(T) = 0
    // ∫(0->T) v(t)dt = -initialHeight
    
    // 令 a = k·initialVelocity/T²
    // 由零点条件得到：b = -(k+1)·initialVelocity/T
    // 由积分条件解得：k = -3
    // 最终得到：T = -initialHeight/initialVelocity
    
    const T = -initialHeight / initialVelocity;  // 着陆时间    
    
    if (t > T) {
        return { height: 0, velocity: 0 };
    }
    
    // 构造速度抛物线
    const k = -3;
    const a = k * initialVelocity / (T * T);        // 正值
    const b = -(k + 1) * initialVelocity / T;       // 负值
    const c = initialVelocity;                      // 负值
    
    // 计算当前时刻的速度
    const velocity = a * t * t + b * t + c;
    
    // 计算当前时刻的高度（速度的积分）
    const height = initialHeight + (a * t * t * t / 3 + b * t * t / 2 + c * t);
    
    return {
        height: Math.max(0, height),
        velocity: Math.min(0, velocity)
    };
}

// 更新模拟函数
function simulate() {
    if (frame >= simulationData.t.length) return;
    
    const t = simulationData.t[frame];
    const height = simulationData.height[frame];
    const velocity = simulationData.velocity[frame];
    
    animateRocket(height);
    updateStatus(t, height, velocity);
    frame++;
    
    setTimeout(simulate, interval);
}

// 添加调试信息显示区域
const debugDisplay = document.createElement('div');
debugDisplay.id = 'debug-display';
debugDisplay.style.cssText = 'margin: 20px auto; width: 90%; background: rgba(0,0,0,0.8); color: white; padding: 10px; font-family: monospace; max-height: 400px; overflow-y: auto;';
document.querySelector('#rocket-container').after(debugDisplay);

// 调试信息打印函数
function debugLog(message) {
    const logEntry = document.createElement('div');
    logEntry.textContent = message;
    debugDisplay.appendChild(logEntry);
    // 保持滚动到最新的信息
    debugDisplay.scrollTop = debugDisplay.scrollHeight;
    // 限制显示的行数
    while (debugDisplay.children.length > 100) {
        debugDisplay.removeChild(debugDisplay.firstChild);
    }
}

function runSimulation() {
    debugDisplay.innerHTML = '';
    debugLog('开始新的模拟...');
    debugLog(`初始配置: 高度=${config.initial_height}m, 速度=${config.initial_velocity}m/s`);
    debugLog(`PID参数: kp=${config.kp}, ki=${config.ki}, kd=${config.kd}`);
    debugLog(`噪声幅度: ${config.noise_amplitude}`);
    
    const dt = config.time_step;
    const simTime = config.sim_time;
    const t = [];
    for (let i = 0; i <= simTime; i += dt) {
        t.push(i);
    }
    simulationData.t = t;

    simulationData.height = new Array(t.length).fill(0);
    simulationData.velocity = new Array(t.length).fill(0);
    simulationData.thrust = new Array(t.length).fill(0);
    simulationData.acceleration = new Array(t.length).fill(0);
    simulationData.target_trajectory = new Array(t.length).fill(0);
    simulationData.target_velocity_trajectory = new Array(t.length).fill(0);

    simulationData.height[0] = config.initial_height;
    simulationData.velocity[0] = config.initial_velocity;

    const g = -9.81;
    let integralError = 0;
    let prevError = 0;
    let landed = false;

    for (let i = 1; i < t.length; i++) {
        if (landed) continue;

        const ideal = calculateIdealTrajectory(t[i], config.initial_height, config.initial_velocity);
        simulationData.target_trajectory[i] = ideal.height;
        simulationData.target_velocity_trajectory[i] = ideal.velocity;

        const shouldLog = i % 10 === 0;
        if (shouldLog) {
            debugLog(`\n时间步 ${i} (t=${t[i].toFixed(1)}s):`);
            debugLog(`目标: 高度=${ideal.height.toFixed(2)}m, 速度=${ideal.velocity.toFixed(2)}m/s`);
            debugLog(`当前: 高度=${simulationData.height[i-1].toFixed(2)}m, 速度=${simulationData.velocity[i-1].toFixed(2)}m/s`);
        }

        let thrust;
        if (simulationData.height[i-1] < 5) {
            thrust = 900;
            if (shouldLog) {
                debugLog(`高度小于最低米数，强制推力900N`);
            }
        } else {
            // 添加随机扰动到测量值
            const measuredVelocity = simulationData.velocity[i-1] + (Math.random() * 2 - 1) * config.noise_amplitude;
            const velocityError = ideal.velocity - measuredVelocity;
            
            if (shouldLog) {
                debugLog(`实际速度: ${simulationData.velocity[i-1].toFixed(2)}m/s`);
                debugLog(`测量速度: ${measuredVelocity.toFixed(2)}m/s`);
                debugLog(`速度误差: ${velocityError.toFixed(2)}m/s`);
            }
            
            // 限制积分项的累积
            const maxIntegralForce = (config.max_thrust - config.rocket_mass * Math.abs(g)) / config.ki;
            integralError = Math.max(-maxIntegralForce, Math.min(maxIntegralForce, integralError + velocityError * dt));
            const derivative = (velocityError - prevError) / dt;
            
            if (shouldLog) {
                debugLog(`积分误差: ${integralError.toFixed(2)}, 微分: ${derivative.toFixed(2)}`);
            }

            const gravityCompensation = config.rocket_mass * Math.abs(g);
            
            // 计算PID输出，考虑到最大推力限制
            const maxPidOutput = config.max_thrust - gravityCompensation;
            const pidOutput = Math.max(-gravityCompensation, 
                                    Math.min(maxPidOutput, 
                                           config.kp * velocityError + 
                                           config.ki * integralError + 
                                           config.kd * derivative));
            
            // 添加推力随机扰动
            const thrustNoise = (Math.random() * 2 - 1) * config.noise_amplitude * config.max_thrust;
            thrust = Math.min(Math.max(gravityCompensation + pidOutput + thrustNoise, 0), config.max_thrust);
            
            if (shouldLog) {
                debugLog(`推力噪声: ${thrustNoise.toFixed(2)}N`);
                debugLog(`最终推力: ${thrust.toFixed(2)}N`);
            }
            
            prevError = velocityError;
        }
        
        // 添加加速度随机扰动
        const accelerationNoise = (Math.random() * 2 - 1) * config.noise_amplitude * Math.abs(g);
        simulationData.thrust[i] = thrust;
        simulationData.acceleration[i] = thrust / config.rocket_mass + g + accelerationNoise;
        simulationData.velocity[i] = simulationData.velocity[i-1] + simulationData.acceleration[i] * dt;
        simulationData.height[i] = simulationData.height[i-1] + simulationData.velocity[i] * dt;

        if (shouldLog) {
            debugLog(`加速度噪声: ${accelerationNoise.toFixed(2)}m/s²`);
            debugLog(`结果: 加速度=${simulationData.acceleration[i].toFixed(2)}m/s², 速度=${simulationData.velocity[i].toFixed(2)}m/s, 高度=${simulationData.height[i].toFixed(2)}m`);
        }

        if (simulationData.height[i] <= 0) {
            simulationData.height[i] = 0;
            simulationData.velocity[i] = 0;
            landed = true;
            debugLog('\n着陆！');
            debugLog(`最终状态: 时间=${t[i].toFixed(1)}s, 速度=${simulationData.velocity[i].toFixed(2)}m/s`);
        }
    }

    updateCharts();
    simulate();
}

// 初始化图表
updateCharts();
