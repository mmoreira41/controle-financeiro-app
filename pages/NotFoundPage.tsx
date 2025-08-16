import React from 'react';
import PageHeader from '../components/PageHeader';
import { Construction } from 'lucide-react';

interface NotFoundPageProps {
  pageTitle: string;
}

const PodeApagar: React.FC<NotFoundPageProps> = ({ pageTitle }) => {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title={pageTitle}
        description="Esta seção está em desenvolvimento."
      />
      <div className="bg-gray-800 p-10 rounded-lg shadow-md flex flex-col items-center justify-center h-96">
        <Construction className="text-yellow-400" size={64} />
        <h3 className="text-2xl font-semibold mt-6">Página em Construção</h3>
        <p className="text-gray-400 mt-2 text-center">
          Estamos trabalhando para trazer esta funcionalidade para você em breve!
        </p>
      </div>
    </div>
  );
};

export default PodeApagar;
