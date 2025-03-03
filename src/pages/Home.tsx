import React from 'react';

const Home: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Compiler Product
        </h1>
        <p className="text-xl text-gray-600">
          A powerful and efficient compiler solution
        </p>
      </header>

      <main>
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Fast Compilation</h2>
            <p className="text-gray-600">
              Lightning-fast compilation speeds for your projects
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Advanced Optimization</h2>
            <p className="text-gray-600">
              Sophisticated optimization techniques for better performance
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Developer Friendly</h2>
            <p className="text-gray-600">
              Intuitive interface and comprehensive documentation
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home; 