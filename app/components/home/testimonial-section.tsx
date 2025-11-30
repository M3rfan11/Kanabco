"use client"

import { useState, useEffect } from "react"
import { TestimonialCard } from "./testimonial-card"


interface Testimonial {
  id: number
  author: string
  testimonial: string
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    author: "Sarah L.",
    testimonial: "Kanabco transformed my living space! The quality and design are simply unmatched.",
  },
  {
    id: 2,
    author: "David M.",
    testimonial: "The furniture is not only beautiful but incredibly comfortable. Highly recommend!",
  },
  {
    id: 3,
    author: "Emily R.",
    testimonial: "Exceptional customer service and stunning pieces. My home feels so much more luxurious now.",
  },
  {
    id: 4,
    author: "Michael B.",
    testimonial: "I love the modern aesthetic and durability of Kanabco's collection. A true investment.",
  },
    {
    id: 5,
    author: "Sarah L.",
    testimonial: "Kanabco transformed my living space! The quality and design are simply unmatched.",
  },
  {
    id: 6,
    author: "David M.",
    testimonial: "The furniture is not only beautiful but incredibly comfortable. Highly recommend!",
  },
  {
    id: 7,
    author: "Emily R.",
    testimonial: "Exceptional customer service and stunning pieces. My home feels so much more luxurious now.",
  },
  {
    id: 8,
    author: "Michael B.",
    testimonial: "I love the modern aesthetic and durability of Kanabco's collection. A true investment.",
  },
]

export default function TestimonialSection() {
  const [shuffledTestimonials, setShuffledTestimonials] = useState<Testimonial[]>([])

  useEffect(() => {
    setShuffledTestimonials(testimonials)
  }, [])

  const handleShuffle = () => {
    setShuffledTestimonials((prev) => {
      const newOrder = [...prev]
      const firstCard = newOrder.shift() // Take the first card
      if (firstCard) {
        newOrder.push(firstCard) // Move it to the end
      }
      return newOrder
    })
  }

  return (
    <div className="relative min-h-screen bg-white py-16 flex flex-col items-center justify-center">
      <div className="max-w-4xl text-center mb-16 px-4">
        <h2 className="text-4xl md:text-5xl font-oblong font-bold text-[#18395c] mb-4">WHAT OUR CLIENTS SAY</h2>
        <p className="text-[#18395c] font-gill-sans text-lg leading-relaxed">
          Hear directly from our satisfied customers about their experience with Kanabco's furniture and service.
        </p>
      </div>

      <div className="relative h-[450px] w-[550px] mx-auto">
        {shuffledTestimonials.map((testimonial, index) => {
          let position: "front" | "middle" | "back" = "back"
          if (index === 0) position = "front"
          else if (index === 1) position = "middle"

          // Only render the first three cards for the visual stack
          if (index >= 3) return null

          return (
            <TestimonialCard
              key={testimonial.id}
              id={testimonial.id}
              author={testimonial.author}
              testimonial={testimonial.testimonial}
              position={position}
              handleShuffle={handleShuffle}
            />
          )
        })}
      </div>
    </div>
  )
}
