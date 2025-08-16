import React from 'react';
import PageHeader from '../components/PageHeader';
import JurosCompostosSimulador from '../components/JurosCompostosSimulador';

const CalculadoraJurosCompostosPage: React.FC = () => {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Calculadora de Juros Compostos"
        description="Projete o crescimento dos seus investimentos ao longo do tempo."
      />
      <div className="mt-8">
        <JurosCompostosSimulador />
      </div>
    </div>
  );
};

export default CalculadoraJurosCompostosPage;