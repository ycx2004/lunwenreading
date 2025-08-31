好的，这是从您提供的 HTML 文件内容转换而来的 Markdown 文件。

您可将以下文本内容复制并保存为一个 `.md` 文件。

---

# 强化学习系统笔记
**Reinforcement Learning System Notes - 完整理论与实践指南**

## 目录 Table of Contents
- [1. 强化学习概述](#1-强化学习概述)
- [2. 马尔可夫决策过程](#2-马尔可夫决策过程-mdp)
- [3. 价值函数](#3-价值函数)
- [4. 策略与策略优化](#4-策略与策略优化)
- [5. 动态规划方法](#5-动态规划方法)
- [6. 蒙特卡洛方法](#6-蒙特卡洛方法)
- [7. 时序差分学习](#7-时序差分学习)
- [8. 函数逼近](#8-函数逼近)
- [9. 策略梯度方法](#9-策略梯度方法)
- [10. Actor-Critic方法](#10-actor-critic方法)
- [11. 深度强化学习](#11-深度强化学习)
- [12. 高级主题](#12-高级主题)

---

## 1. 强化学习概述

### 1.1 基本概念

> **定义：强化学习**
>
> 强化学习是一种机器学习范式，智能体通过与环境的交互来学习如何在特定环境中采取行动以最大化累积奖励。

强化学习系统包含四个主要组成部分：
- **智能体 (Agent)**：学习和决策的实体
- **环境 (Environment)**：智能体操作的外部系统
- **状态 (State)**：环境的当前情况描述
- **行动 (Action)**：智能体可以执行的操作
- **奖励 (Reward)**：环境对智能体行动的反

> **关键特征**
>
> - 试错学习 (Trial-and-error learning)
> - 延迟奖励 (Delayed reward)
> - 探索与开发的权衡 (Exploration vs Exploitation)
> - 时序决策 (Sequential decision making)

### 1.2 与其他机器学习方法的比较

| 特征 | 监督学习 | 无监督学习 | 强化学习 |
| :--- | :--- | :--- | :--- |
| **反馈类型** | 标签/目标值 | 无反馈 | 奖励信号 |
| **反馈时机** | 即时 | - | 可能延迟 |
| **数据特性** | 独立同分布 | 独立同分布 | 时序相关 |
| **目标** | 泛化到新数据 | 发现模式 | 最大化累积奖励 |

---

## 2. 马尔可夫决策过程 (MDP)

### 2.1 MDP的定义

> **马尔可夫决策过程**
>
> MDP是一个五元组：$\mathcal{M} = (\mathcal{S}, \mathcal{A}, \mathcal{P}, \mathcal{R}, \gamma)$
> - $\mathcal{S}$：状态空间
> - $\mathcal{A}$：动作空间
> - $\mathcal{P}$：状态转移概率函数
> - $\mathcal{R}$：奖励函数
> - $\gamma$：折扣因子 ($0 \leq \gamma \leq 1$)

> **状态转移概率：**
> $$P(s'|s,a) = \Pr(S_{t+1} = s' | S_t = s, A_t = a)$$
> **奖励函数：**
> $$R(s,a,s') = \mathbb{E}[R_{t+1} | S_t = s, A_t = a, S_{t+1} = s']$$

### 2.2 马尔可夫性质

> **马尔可夫性质**
>
> 未来状态只依赖于当前状态，而不依赖于历史状态：
> $$\Pr(S_{t+1} | S_t, S_{t-1}, \ldots, S_1) = \Pr(S_{t+1} | S_t)$$

这个性质使得我们可以：
- 简化状态表示
- 使用动态规划方法求解
- 保证算法的收敛性

### 2.3 回报与折扣

> **累积回报：**
> $$G_t = R_{t+1} + \gamma R_{t+2} + \gamma^2 R_{t+3} + \ldots = \sum_{k=0}^{\infty} \gamma^k R_{t+k+1}$$
> **递归形式：**
> $$G_t = R_{t+1} + \gamma G_{t+1}$$

> **折扣因子的作用**
>
> - $\gamma = 0$：只考虑即时奖励（近视）
> - $\gamma = 1$：所有未来奖励等权重（远视）
> - $0 < \gamma < 1$：平衡即时与未来奖励

---

## 3. 价值函数

### 3.1 状态价值函数

> **状态价值函数**
>
> 在策略$\pi$下，状态$s$的价值定义为从该状态开始的期望累积回报：

$$V^\pi(s) = \mathbb{E}_\pi[G_t | S_t = s] = \mathbb{E}_\pi\left[\sum_{k=0}^{\infty} \gamma^k R_{t+k+1} | S_t = s\right]$$

**Bellman期望方程**
$$V^\pi(s) = \sum_a \pi(a|s) \sum_{s'} P(s'|s,a)[R(s,a,s') + \gamma V^\pi(s')]$$

### 3.2 动作价值函数

> **动作价值函数 (Q函数)**
>
> 在策略$\pi$下，状态$s$执行动作$a$的价值：

$$Q^\pi(s,a) = \mathbb{E}_\pi[G_t | S_t = s, A_t = a]$$

**Bellman期望方程：**
$$Q^\pi(s,a) = \sum_{s'} P(s'|s,a)[R(s,a,s') + \gamma \sum_{a'} \pi(a'|s') Q^\pi(s',a')]$$

> **V和Q的关系**
>
> $$V^\pi(s) = \sum_a \pi(a|s) Q^\pi(s,a)$$
> $$Q^\pi(s,a) = \sum_{s'} P(s'|s,a)[R(s,a,s') + \gamma V^\pi(s')]$$

### 3.3 最优价值函数

**最优状态价值函数：**
$$V^*(s) = \max_\pi V^\pi(s)$$
**最优动作价值函数：**
$$Q^*(s,a) = \max_\pi Q^\pi(s,a)$$

**Bellman最优方程**
$$V^*(s) = \max_a Q^*(s,a) = \max_a \sum_{s'} P(s'|s,a)[R(s,a,s') + \gamma V^*(s')]$$
$$Q^*(s,a) = \sum_{s'} P(s'|s,a)[R(s,a,s') + \gamma \max_{a'} Q^*(s',a')]$$

---

## 4. 策略与策略优化

### 4.1 策略定义

> **策略**
>
> 策略$\pi$是从状态到动作的映射，定义智能体在各种状态下的行为。

- **确定性策略：** $\pi(s) = a$
- **随机策略：** $\pi(a|s) = \Pr(A_t = a | S_t = s)$

> **策略约束：**
> $$\sum_a \pi(a|s) = 1, \quad \forall s \in \mathcal{S}$$
> $$\pi(a|s) \geq 0, \quad \forall s \in \mathcal{S}, \forall a \in \mathcal{A}$$

### 4.2 策略评估

> **算法：迭代策略评估**
> ```
> function PolicyEvaluation(π, θ):
>     // 初始化价值函数
>     V(s) ← 0 for all s ∈ S
>     
>     repeat:
>         Δ ← 0
>         for each s ∈ S:
>             v ← V(s)
>             V(s) ← Σₐ π(a|s) Σₛ' P(s'|s,a)[R(s,a,s') + γV(s')]
>             Δ ← max(Δ, |v - V(s)|)
>     until Δ < θ
>     
>     return V
> ```

### 4.3 策略改进

> **策略改进定理**
>
> 对于任意确定性策略$\pi$，构造贪心策略：
> $$\pi'(s) = \arg\max_a Q^\pi(s,a)$$
> 则有$V^{\pi'}(s) \geq V^\pi(s)$对所有$s$成立。

> **算法：策略改进**
> ```
> function PolicyImprovement(V):
>     policy-stable ← true
>     
>     for each s ∈ S:
>         old-action ← π(s)
>         π(s) ← argmax_a Σₛ' P(s'|s,a)[R(s,a,s') + γV(s')]
>         
>         if old-action ≠ π(s):
>             policy-stable ← false
>     
>     return π, policy-stable
> ```

---

## 5. 动态规划方法

### 5.1 策略迭代

> **算法：策略迭代**
> ```
> function PolicyIteration():
>     // 初始化
>     π(s) ← 任意策略 for all s ∈ S
>     
>     repeat:
>         // 策略评估
>         V ← PolicyEvaluation(π)
>         
>         // 策略改进
>         π, policy-stable ← PolicyImprovement(V)
>         
>     until policy-stable
>     
>     return π, V
> ```

> **收敛性**
>
> 策略迭代算法保证收敛到最优策略$\pi^*$和最优价值函数$V^*$。

### 5.2 价值迭代

> **算法：价值迭代**
> ```
> function ValueIteration(θ):
>     V(s) ← 0 for all s ∈ S
>     
>     repeat:
>         Δ ← 0
>         for each s ∈ S:
>             v ← V(s)
>             V(s) ← maxₐ Σₛ' P(s'|s,a)[R(s,a,s') + γV(s')]
>             Δ ← max(Δ, |v - V(s)|)
>     until Δ < θ
>     
>     // 提取最优策略
>     π(s) ← argmaxₐ Σₛ' P(s'|s,a)[R(s,a,s') + γV(s')]
>     
>     return π, V
> ```

> **价值迭代更新公式：**
> $$V_{k+1}(s) = \max_a \sum_{s'} P(s'|s,a)[R(s,a,s') + \gamma V_k(s')]$$

### 5.3 广义策略迭代

> **广义策略迭代框架**
>
> 几乎所有强化学习方法都可以看作是广义策略迭代的特例，包含两个交互过程：
> - **策略评估：**使价值函数与当前策略一致
> - **策略改进：**使策略相对于当前价值函数贪心

---

## 6. 蒙特卡洛方法

### 6.1 基本思想

蒙特卡洛方法基于采样和平均来估计价值函数，不需要环境的完整模型。

> **关键特点**
>
> - 基于完整回合 (Episodes)
> - 无偏估计
> - 不需要环境模型
> - 高方差

### 6.2 首次访问MC方法

> **算法：首次访问MC策略评估**
> ```
> function FirstVisitMC(π, episodes):
>     Returns(s) ← 空列表 for all s ∈ S
>     V(s) ← 0 for all s ∈ S
>     
>     for episode = 1 to episodes:
>         // 生成回合：S₀, A₀, R₁, S₁, A₁, R₂, ..., Sₜ
>         G ← 0
>         
>         for t = T-1 down to 0:
>             G ← γG + R_{t+1}
>             
>             if Sₜ 未在 S₀, S₁, ..., S_{t-1} 中出现:
>                 Append G to Returns(Sₜ)
>                 V(Sₜ) ← average(Returns(Sₜ))
>     
>     return V
> ```

### 6.3 MC控制方法

**探索性开始**

> **算法：蒙特卡洛探索性开始**
> ```
> function MonteCarloES():
>     Q(s,a) ← 任意值 for all s ∈ S, a ∈ A
>     π(s) ← 任意确定性策略 for all s ∈ S
>     Returns(s,a) ← 空列表 for all s ∈ S, a ∈ A
>     
>     repeat forever:
>         // 选择随机的开始状态和动作
>         S₀, A₀ ← 随机选择使得所有(s,a)都有可能
>         
>         // 生成从S₀, A₀开始的回合
>         生成回合遵循π: S₀, A₀, R₁, S₁, A₁, R₂, ..., Sₜ
>         G ← 0
>         
>         for t = T-1 down to 0:
>             G ← γG + R_{t+1}
>             
>             if (Sₜ, Aₜ) 未在之前出现:
>                 Append G to Returns(Sₜ, Aₜ)
>                 Q(Sₜ, Aₜ) ← average(Returns(Sₜ, Aₜ))
>                 π(Sₜ) ← argmaxₐ Q(Sₜ, a)
> ```

**ε-贪心策略**
> **ε-贪心策略定义：**
> $$\pi(a|s) = \begin{cases}
> 1 - \varepsilon + \frac{\varepsilon}{|\mathcal{A}(s)|} & \text{if } a = \arg\max_a Q(s,a) \\
> \frac{\varepsilon}{|\mathcal{A}(s)|} & \text{otherwise}
> \end{cases}$$

---

## 7. 时序差分学习

### 7.1 TD学习基础

时序差分学习结合了蒙特卡洛和动态规划的优点：
- 像MC一样，从经验中学习，无需环境模型
- 像DP一样，基于其他估计值更新估计（bootstrap）

> **TD(0)更新公式：**
> $$V(S_t) \leftarrow V(S_t) + \alpha[R_{t+1} + \gamma V(S_{t+1}) - V(S_t)]$$
> 其中 $\delta_t = R_{t+1} + \gamma V(S_{t+1}) - V(S_t)$ 称为**TD误差**。

### 7.2 SARSA算法

> **算法：SARSA (同策略TD控制)**
> ```
> function SARSA(α, γ, ε):
>     Q(s,a) ← 0 for all s ∈ S, a ∈ A (或其他初始值)
>     
>     for each episode:
>         初始化 S
>         根据Q选择A (例如ε-贪心)
>         
>         repeat (对回合中每一步):
>             执行动作A，观察R, S'
>             根据Q从S'选择A' (例如ε-贪心)
>             Q(S,A) ← Q(S,A) + α[R + γQ(S',A') - Q(S,A)]
>             S ← S'; A ← A'
>         until S 是终止状态
> ```

> **SARSA更新公式：**
> $$Q(S_t, A_t) \leftarrow Q(S_t, A_t) + \alpha[R_{t+1} + \gamma Q(S_{t+1}, A_{t+1}) - Q(S_t, A_t)]$$

### 7.3 Q-Learning算法

> **算法：Q-Learning (异策略TD控制)**
> ```
> function QLearning(α, γ, ε):
>     Q(s,a) ← 0 for all s ∈ S, a ∈ A (或其他初始值)
>     
>     for each episode:
>         初始化 S
>         
>         repeat (对回合中每一步):
>             根据Q从S选择A (例如ε-贪心)
>             执行动作A，观察R, S'
>             Q(S,A) ← Q(S,A) + α[R + γ maxₐ Q(S',a) - Q(S,A)]
>             S ← S'
>         until S 是终止状态
> ```

> **Q-Learning更新公式：**
> $$Q(S_t, A_t) \leftarrow Q(S_t, A_t) + \alpha[R_{t+1} + \gamma \max_a Q(S_{t+1}, a) - Q(S_t, A_t)]$$

> **SARSA vs Q-Learning**
>
> - **SARSA：**同策略，学习正在执行的策略
> - **Q-Learning：**异策略，学习最优策略

### 7.4 期望SARSA

> **期望SARSA更新公式：**
> $$Q(S_t, A_t) \leftarrow Q(S_t, A_t) + \alpha[R_{t+1} + \gamma \mathbb{E}_\pi[Q(S_{t+1}, A_{t+1}) | S_{t+1}] - Q(S_t, A_t)]$$
> **对于离散动作：**
> $$Q(S_t, A_t) \leftarrow Q(S_t, A_t) + \alpha\left[R_{t+1} + \gamma \sum_a \pi(a|S_{t+1}) Q(S_{t+1}, a) - Q(S_t, A_t)\right]$$

---

## 8. 函数逼近

### 8.1 为什么需要函数逼近

当状态空间或动作空间过大时，表格方法不再适用：
- 内存需求过大
- 学习时间过长
- 缺乏泛化能力

> **函数逼近**
>
> 用参数化函数$\hat{v}(s, \mathbf{w}) \approx v_\pi(s)$或$\hat{q}(s, a, \mathbf{w}) \approx q_\pi(s, a)$来近似价值函数。

### 8.2 梯度下降方法

> **价值函数逼近的目标：**
> $$\min_{\mathbf{w}} \mathbb{E}[\left(v_\pi(S) - \hat{v}(S, \mathbf{w})\right)^2]$$
> **随机梯度下降更新：**
> $$\mathbf{w}_{t+1} = \mathbf{w}_t + \alpha \left[v_\pi(S_t) - \hat{v}(S_t, \mathbf{w}_t)\right] \nabla_{\mathbf{w}} \hat{v}(S_t, \mathbf{w}_t)$$

**线性函数逼近**
> $$\hat{v}(s, \mathbf{w}) = \mathbf{w}^T \mathbf{x}(s) = \sum_{i=1}^d w_i x_i(s)$$
> 其中$\mathbf{x}(s) = [x_1(s), x_2(s), \ldots, x_d(s)]^T$是特征向量。
> **梯度：**
> $$\nabla_{\mathbf{w}} \hat{v}(s, \mathbf{w}) = \mathbf{x}(s)$$

### 8.3 半梯度TD方法

> **算法：半梯度TD(0)**
> ```
> function SemiGradientTD(α, γ):
>     初始化权重 w ∈ ℝᵈ 任意值
>     
>     for each episode:
>         S ← 初始状态
>         
>         repeat:
>             A ← 根据π(·|S)选择的动作
>             执行A，观察R, S'
>             
>             if S' 是终止状态:
>                 w ← w + α[R - v̂(S,w)]∇_w v̂(S,w)
>             else:
>                 w ← w + α[R + γv̂(S',w) - v̂(S,w)]∇_w v̂(S,w)
>             
>             S ← S'
>         until S 是终止状态
> ```

> **为什么是"半"梯度**
>
> 因为目标$R_{t+1} + \gamma \hat{v}(S_{t+1}, \mathbf{w}_t)$也依赖于$\mathbf{w}$，但我们忽略了这个依赖关系。

### 8.4 深度Q网络 (DQN)基础

> **DQN损失函数：**
> $$L(\theta) = \mathbb{E}[(y - Q(s,a;\theta))^2]$$
> 其中目标值：
> $$y = r + \gamma \max_{a'} Q(s',a';\theta^-)$$
> $\theta^-$是目标网络参数。

> **DQN关键技术**
>
> - **经验回放：**打破数据相关性
> - **目标网络：**稳定训练过程
> - **ε-贪心探索：**平衡探索与开发

---

## 9. 策略梯度方法

### 9.1 策略梯度基础

直接优化参数化策略$\pi(a|s, \boldsymbol{\theta})$，而不是通过价值函数间接获得策略。

> **目标函数：**
> $$J(\boldsymbol{\theta}) = \mathbb{E}_{\pi_\theta}[G_t] = \mathbb{E}_{\pi_\theta}\left[\sum_{k=0}^{\infty} \gamma^k R_{t+k+1}\right]$$
> **策略梯度定理：**
> $$\nabla_{\boldsymbol{\theta}} J(\boldsymbol{\theta}) = \mathbb{E}_{\pi_\theta}[G_t \nabla_{\boldsymbol{\theta}} \ln \pi(A_t|S_t, \boldsymbol{\theta})]$$

> **策略梯度的优势**
>
> - 可以处理连续动作空间
> - 可以学习随机策略
> - 具有良好的收敛性质

### 9.2 REINFORCE算法

> **算法：REINFORCE**
> ```
> function REINFORCE(α, γ):
>     初始化策略参数 θ ∈ ℝᵈ
>     
>     for each episode:
>         生成回合 S₀, A₀, R₁, S₁, A₁, R₂, ..., S_{T-1}, A_{T-1}, R_T
>         
>         for t = 0 to T-1:
>             G ← Σₖ₌ₜ^{T-1} γ^{k-t} Rₖ₊₁
>             θ ← θ + αγᵗG∇_θ ln π(Aₜ|Sₜ, θ)
> ```

> **REINFORCE更新公式：**
> $$\boldsymbol{\theta}_{t+1} = \boldsymbol{\theta}_t + \alpha \gamma^t G_t \nabla_{\boldsymbol{\theta}} \ln \pi(A_t|S_t, \boldsymbol{\theta}_t)$$

### 9.3 带基线的REINFORCE

为减少方差，引入基线$b(s)$：

> $$\nabla_{\boldsymbol{\theta}} J(\boldsymbol{\theta}) = \mathbb{E}_{\pi_\theta}[(G_t - b(S_t)) \nabla_{\boldsymbol{\theta}} \ln \pi(A_t|S_t, \boldsymbol{\theta})]$$

> **算法：带基线的REINFORCE**
> ```
> function REINFORCEWithBaseline(α_θ, α_w, γ):
>     初始化策略参数 θ 和状态价值权重 w
>     
>     for each episode:
>         生成回合 S₀, A₀, R₁, S₁, A₁, R₂, ..., S_{T-1}, A_{T-1}, R_T
>         
>         for t = 0 to T-1:
>             G ← Σₖ₌ₜ^{T-1} γ^{k-t} Rₖ₊₁
>             δ ← G - v̂(Sₜ, w)
>             w ← w + α_w δ∇_w v̂(Sₜ, w)
>             θ ← θ + α_θ γᵗδ∇_θ ln π(Aₜ|Sₜ, θ)
> ```

---

## 10. Actor-Critic方法

### 10.1 基本思想

> **Actor-Critic框架**
>
> - **Actor：**策略函数$\pi(a|s, \boldsymbol{\theta})$，负责选择动作
> - **Critic：**价值函数$\hat{v}(s, \mathbf{w})$，负责评估状态价值

> **Actor更新：**
> $$\boldsymbol{\theta}_{t+1} = \boldsymbol{\theta}_t + \alpha_\theta \delta_t \nabla_{\boldsymbol{\theta}} \ln \pi(A_t|S_t, \boldsymbol{\theta}_t)$$
> **Critic更新：**
> $$\mathbf{w}_{t+1} = \mathbf{w}_t + \alpha_w \delta_t \nabla_{\mathbf{w}} \hat{v}(S_t, \mathbf{w}_t)$$
> 其中TD误差：$\delta_t = R_{t+1} + \gamma \hat{v}(S_{t+1}, \mathbf{w}_t) - \hat{v}(S_t, \mathbf{w}_t)$

### 10.2 一步Actor-Critic

> **算法：一步Actor-Critic**
> ```
> function OneStepActorCritic(α_θ, α_w, γ):
>     初始化策略参数 θ 和价值函数权重 w
>     
>     for each episode:
>         S ← 初始状态
>         I ← 1
>         
>         repeat:
>             A ← 根据π(·|S, θ)采样的动作
>             执行A，观察S', R
>             
>             δ ← R + γv̂(S', w) - v̂(S, w) (如果S'是终止状态，则γv̂(S', w) = 0)
>             w ← w + α_w δ∇_w v̂(S, w)
>             θ ← θ + α_θ I δ∇_θ ln π(A|S, θ)
>             
>             I ← γI
>             S ← S'
>         until S 是终止状态
> ```

### 10.3 优势Actor-Critic (A2C)

> **优势函数**
>
> 优势函数衡量在状态$s$执行动作$a$相比于平均情况的优势：
> $$A^\pi(s,a) = Q^\pi(s,a) - V^\pi(s)$$

> **优势估计：**
> $$A_t = \delta_t = R_{t+1} + \gamma V(S_{t+1}) - V(S_t)$$
> **多步优势估计：**
> $$A_t^{(n)} = \sum_{k=0}^{n-1} \gamma^k R_{t+k+1} + \gamma^n V(S_{t+n}) - V(S_t)$$

> **A2C vs A3C**
>
> - **A2C：**同步更新，稳定训练
> - **A3C：**异步更新，更快训练

---

## 11. 深度强化学习

### 11.1 深度Q网络改进

**双Q网络 (Double DQN)**
> **标准DQN目标：**
> $$y^{DQN} = R + \gamma \max_{a'} Q(S', a'; \theta^-)$$
> **Double DQN目标：**
> $$y^{DDQN} = R + \gamma Q(S', \arg\max_{a'} Q(S', a'; \theta); \theta^-)$$

**优先经验回放**

根据TD误差的大小对经验进行优先级排序，重要的经验被更频繁地采样。

> **优先级：**
> $$p_i = (|\delta_i| + \epsilon)^\alpha$$
> **采样概率：**
> $$P(i) = \frac{p_i^\alpha}{\sum_k p_k^\alpha}$$

**竞争网络 (Dueling DQN)**
> $$Q(s,a; \theta, \alpha, \beta) = V(s; \theta, \beta) + \left(A(s,a; \theta, \alpha) - \frac{1}{|\mathcal{A}|}\sum_{a'} A(s,a'; \theta, \alpha)\right)$$

### 11.2 策略梯度方法改进

**信赖域策略优化 (TRPO)**
> **约束优化问题：**
> $$\max_\theta \mathbb{E}_{s \sim \rho_{\pi_{\theta_{old}}}, a \sim \pi_{\theta_{old}}} \left[ \frac{\pi_\theta(a|s)}{\pi_{\theta_{old}}(a|s)} A^{\pi_{\theta_{old}}}(s,a) \right]$$
> **约束条件：**
> $$\mathbb{E}_{s \sim \rho_{\pi_{\theta_{old}}}} [D_{KL}(\pi_{\theta_{old}}(\cdot|s) || \pi_\theta(\cdot|s))] \leq \delta$$

**近端策略优化 (PPO)**
> **PPO-Clip目标函数：**
> $$L^{CLIP}(\theta) = \mathbb{E}_t[\min(r_t(\theta) A_t, \text{clip}(r_t(\theta), 1-\epsilon, 1+\epsilon) A_t)]$$
> 其中 $r_t(\theta) = \frac{\pi_\theta(a_t|s_t)}{\pi_{\theta_{old}}(a_t|s_t)}$

### 11.3 确定性策略梯度

**深度确定性策略梯度 (DDPG)**

> **算法：DDPG**
> ```
> function DDPG():
>     初始化：
>     - 演员网络 μ(s|θᵘ) 和目标演员网络 μ'
>     - 评论家网络 Q(s,a|θᵠ) 和目标评论家网络 Q'
>     - 经验回放缓冲区 R
>     
>     for episode = 1 to M:
>         初始化随机过程 N 用于动作探索
>         S₁ ← 环境初始状态
>         
>         for t = 1 to T:
>             Aₜ ← μ(Sₜ|θᵘ) + Nₜ  // 添加噪声用于探索
>             执行Aₜ，观察奖励Rₜ和新状态Sₜ₊₁
>             存储转换(Sₜ, Aₜ, Rₜ, Sₜ₊₁)到R
>             
>             从R中采样小批量N个转换
>             设置 yᵢ = Rᵢ + γQ'(Sᵢ₊₁, μ'(Sᵢ₊₁|θᵘ')|θᵠ')
>             
>             // 更新评论家
>             通过最小化损失更新θᵠ: L = 1/N Σᵢ(yᵢ - Q(Sᵢ,Aᵢ|θᵠ))²
>             
>             // 更新演员
>             更新θᵘ: ∇θᵘJ ≈ 1/N Σᵢ ∇ₐQ(s,a|θᵠ)|ₛ₌ₛᵢ,ₐ₌μ(ₛᵢ) ∇θᵘμ(s|θᵘ)|ₛ₌ₛᵢ
>             
>             // 软更新目标网络
>             θᵠ' ← τθᵠ + (1-τ)θᵠ'
>             θᵘ' ← τθᵘ + (1-τ)θᵘ'
> ```

---

## 12. 高级主题

### 12.1 多智能体强化学习

多智能体环境中的挑战：
- 非平稳环境
- 部分可观察性
- 通信与协调
- 竞争与合作

**独立学习**
每个智能体独立应用单智能体强化学习算法，将其他智能体视为环境的一部分。

**集中训练分布执行**
训练时使用全局信息，执行时只使用局部观察。

### 12.2 层次强化学习

> **选项 (Options)**
>
> 选项是时间扩展的动作，由三元组$(I, \pi, \beta)$定义：
> - $I \subseteq \mathcal{S}$：启动条件
> - $\pi: \mathcal{S} \times \mathcal{A} \rightarrow$：内部策略
> - $\beta: \mathcal{S} \rightarrow$：终止条件

> **选项-价值函数：**
> $$Q(s, o) = \sum_{a} \pi_o(a|s) \sum_{s'} P(s'|s,a) [R(s,a,s') + \gamma ((1-\beta_o(s')) Q(s',o) + \beta_o(s') V(s'))]$$

### 12.3 模仿学习

**行为克隆 (Behavioral Cloning)**
将模仿学习作为监督学习问题，直接从专家演示中学习策略。
> $$\min_\theta \sum_{i=1}^N \ell(\pi_\theta(s_i), a_i^*)$$

**逆强化学习**
从专家演示中推断奖励函数，然后使用该奖励函数进行强化学习。

**生成对抗模仿学习 (GAIL)**
使用生成对抗网络框架进行模仿学习，判别器区分专家行为和智能体行为。

### 12.4 元学习与迁移学习

**元学习**
学习如何快速适应新任务，"学会学习"。

> **模型无关元学习 (MAML)**
>
> 寻找一个初始化参数，使得经过少量梯度步骤后能快速适应新任务。

> $$\theta^* = \arg\min_\theta \sum_{\mathcal{T}_i \sim p(\mathcal{T})} \mathcal{L}_{\mathcal{T}_i}(f_{\theta_i'})$$
> 其中 $\theta_i' = \theta - \alpha \nabla_\theta \mathcal{L}_{\mathcal{T}_i}(f_\theta)$

**迁移学习**
利用在源任务上学到的知识来改善在目标任务上的学习性能。
- 特征迁移
- 参数迁移
- 知识蒸馏

### 12.5 安全强化学习

确保强化学习智能体在训练和执行过程中的安全性。

**约束强化学习**
> $$\max_\pi \mathbb{E}[G_t] \quad \text{subject to} \quad \mathbb{E}[C_t] \leq d$$

**安全策略改进**
- 保证策略更新不会显著降低性能
- 使用保守的策略改进步骤
- 在线约束监控

> **安全强化学习的关键概念**
>
> - **安全探索：**在探索过程中避免危险状态
> - **风险敏感：**考虑不确定性和风险
> - **鲁棒性：**对环境变化的适应能力
> - **可解释性：**决策过程的透明度