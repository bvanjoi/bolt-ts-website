import type React from 'react';
import { Link } from 'react-router-dom';
import Slider from 'react-slick';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { solarizedlight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const LandingPage: React.FC = () => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
  };

  return (
    <div className="flex min-h-screen bg-white">
      <div className="w-1/2 flex flex-col justify-center items-start p-16">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">Product Name</h1>
        <p className="text-xl text-gray-700 mb-8">
          Your product slogan goes here
        </p>
        <div className="flex space-x-4">
          <button className="bg-gray-900 text-white px-6 py-3 rounded transition hover:bg-gray-700">
            Start
          </button>
          <Link to="/playground">
            <button className="bg-gray-900 text-white px-6 py-3 rounded transition hover:bg-gray-700">
              Playground
            </button>
          </Link>
        </div>
      </div>
      <div className="w-1/2 flex justify-center items-center">
        <div className="w-3/4">
          <Slider {...settings} className="w-full">
            {[1, 2, 3].map(item => (
              <div key={item} className="p-8 bg-gray-100 shadow-md rounded-lg">
                <h2 className="text-3xl font-semibold text-gray-900 mb-4">
                  Showcase {item}
                </h2>
                <SyntaxHighlighter
                  language="typescript"
                  style={solarizedlight}
                  className="rounded mb-4"
                >
                  {`// TypeScript example
const add = (a: number, b: number): number => a + b;
console.log(add(2, 3));`}
                </SyntaxHighlighter>
                <div className="mt-4">
                  <div className="flex items-center mb-2">
                    <span className="w-1/2">tsc</span>
                    <div className="w-full bg-gray-300 rounded-full h-2.5">
                      <div
                        className="bg-gray-900 h-2.5 rounded-full"
                        style={{ width: '40%' }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/2">bolt-ts</span>
                    <div className="w-full bg-gray-300 rounded-full h-2.5">
                      <div
                        className="bg-gray-900 h-2.5 rounded-full"
                        style={{ width: '80%' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </Slider>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
