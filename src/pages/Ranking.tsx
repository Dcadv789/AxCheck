import React from 'react';

function Ranking() {
  return (
    <div>
      <div className="bg-zinc-900 rounded-lg p-8 mb-6">
        <h1 className="text-3xl font-bold text-white mb-3">Ranking</h1>
        <p className="text-gray-400">Compare o desempenho da sua empresa com outras organizações do mesmo segmento.</p>
      </div>

      <div className="bg-zinc-900 rounded-lg p-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-gray-300">
            Descubra como sua empresa se compara com outras organizações em termos de maturidade digital. Nossa análise comparativa oferece insights valiosos sobre seu posicionamento no mercado.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Ranking;