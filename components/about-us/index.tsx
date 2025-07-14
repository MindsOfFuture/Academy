'use client'

import Image from 'next/image'

export default function AboutUs() {
  return (
    <section className="w-full py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Sobre nós</h2>
          <p className="text-sm text-gray-600">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </p>
        </div>

        <div className="bg-white shadow-[8px_8px_0px_#fef3c7] p-8 rounded-xl flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="lg:w-1/2 text-justify text-gray-800 font-medium leading-relaxed">
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam in massa a
              dolor vestibulum dictum. Ut quis porttitor nisl. Proin ultrices mi orci, a
              ultricies lectus viverra et. Nam dictum placerat posuere. Vestibulum ante
              ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Ut
              interdum, nisi a blandit iaculis, elit est condimentum libero, vitae
              maximus ex elit lacinia ex.
            </p>
          </div>

          <div className="lg:w-1/2 w-full flex justify-center">
            <Image
              src="/minds.jpg"
              alt="sobre nós"
              width={400}
              height={300}
              className="rounded shadow"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
