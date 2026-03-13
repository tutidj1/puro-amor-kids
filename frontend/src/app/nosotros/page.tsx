"use client";

import Head from "next/head";

export default function NosotrosPage() {
    return (
        <div className="min-h-screen bg-[#F5F5F3] pt-32 pb-24">
            <Head>
                <title>Nuestra Historia | Puro Amor Kids</title>
            </Head>
            <div className="max-w-4xl mx-auto px-4 sm:px-8">
                <div className="text-center mb-16">
                    <span className="text-[12px] text-brand-yellow font-bold tracking-[0.4em] uppercase mb-4 block">Nuestra Historia</span>
                    <h1 className="text-6xl font-display font-bold text-gray-800 tracking-tighter italic">Especialistas locales en pura ternura</h1>
                </div>

                <div className="bg-white rounded-[3rem] p-12 md:p-16 shadow-premium space-y-8 text-gray-600 font-medium leading-relaxed">
                    <p className="text-xl text-gray-800 font-display italic">
                        Puro Amor Kids nació con un propósito muy claro: ofrecer a las familias de Santa Fe y alrededores la combinación perfecta entre diseño premium, comodidad absoluta y precios accesibles para los más chicos.
                    </p>
                    
                    <p>
                        Entendemos que la ropa infantil no solo debe verse bien, sino que debe acompañar cada salto, cada juego y cada descubrimiento. Por eso, seleccionamos minuciosamente prendas y calzados que garantizan calidad y durabilidad, adaptándonos constantemente a las tendencias sin perder nuestra esencia.
                    </p>

                    <div className="border-l-4 border-brand-yellow pl-6 py-2 my-10">
                        <p className="text-lg font-bold text-gray-800 italic">
                            &quot;Nuestra misión es que cada niño se sienta único y que cada familia encuentre en nosotros un aliado de confianza.&quot;
                        </p>
                    </div>

                    <p>
                        Como especialistas locales, nos enorgullece conocer a nuestra comunidad. Ya sea a través de nuestras entregas rápidas en Santa Fe Capital o en nuestro punto de retiro en Santa Rosa de Calchines, buscamos siempre estar cerca, brindando un trato cálido y personalizado como solo una familia dedicada puede ofrecer.
                    </p>

                    <p>
                        Hoy, Puro Amor Kids es más que una tienda de ropa; es el resultado de la dedicación diaria por llevar magia y estilo a los momentos más importantes del crecimiento de tus hijos.
                    </p>

                    <div className="pt-8 flex flex-wrap gap-4 justify-center">
                        <span className="px-6 py-2 bg-gray-50 rounded-full text-sm font-bold text-gray-800 uppercase tracking-widest">Calidad Premium</span>
                        <span className="px-6 py-2 bg-gray-50 rounded-full text-sm font-bold text-gray-800 uppercase tracking-widest">Diseño Exclusivo</span>
                        <span className="px-6 py-2 bg-gray-50 rounded-full text-sm font-bold text-gray-800 uppercase tracking-widest">Atención Local</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
