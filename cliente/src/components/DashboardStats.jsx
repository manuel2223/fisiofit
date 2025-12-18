import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import './DashboardStats.css';

// colores del donut
const COLORS = ['#008080', '#88D498', '#2F4858', '#004e4e', '#5FA8D3'];

function DashboardStats({ stats, cargando }) {
  if (cargando) {
    return <div className="stats-skeleton skeleton"></div>;
  }

  if (!stats) return null;

  return (
    <div className="stats-container">
      
      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi-card azul">
          <h3>Citas Hoy</h3>
          <div className="kpi-numero">{stats.citasHoy}</div>
          <p>Pacientes agendados</p>
        </div>
        <div className="kpi-card verde">
          <h3>Total Pacientes</h3>
          <div className="kpi-numero">{stats.totalPacientes}</div>
          <p>Base de datos activa</p>
        </div>
        <div className="kpi-card morada">
          <h3>Ingresos Est.</h3>
          <div className="kpi-numero">{stats.citasHoy * 40}€</div>
          <p>Previsión del día</p>
        </div>
      </div>

      {/* GRÁFICOS */}
      <div className="charts-grid">
        
        {/* Gráfico 1: Barras (Semana) */}
        <div className="chart-card tarjeta">
          <h3>Actividad de la Semana</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={stats.graficoSemanal}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  cursor={{ fill: '#f3f4f6' }}
                />
                <Bar 
                  dataKey="citas" 
                  fill="#008080" 
                  radius={[4, 4, 0, 0]} 
                  barSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Donut (Tipos) */}
        <div className="chart-card tarjeta">
          <h3>Tipos de Sesión (Global)</h3>
          <div style={{ width: '100%', height: 300 }}>
            {stats.graficoTipos && stats.graficoTipos.length > 0 ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={stats.graficoTipos}
                    cx="50%"
                    cy="50%"
                    innerRadius={60} 
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.graficoTipos.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.5}}>
                No hay datos suficientes
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default DashboardStats;