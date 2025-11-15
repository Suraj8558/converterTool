'use client';

import { ArrowDown, Download, Github, Linkedin, Mail, Twitter } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const projects = [
  {
    title: 'Real-Time Code Collaboration',
    description:
      'A platform for developers to collaborate on code in real-time, featuring a shared editor, live chat, and syntax highlighting for multiple languages.',
    tags: ['React', 'Node.js', 'WebSockets', 'Monaco Editor'],
    link: '#',
  },
  {
    title: 'E-commerce Analytics Dashboard',
    description:
      'A comprehensive dashboard for visualizing e-commerce data, providing insights into sales, customer behavior, and product performance.',
    tags: ['Vue.js', 'D3.js', 'Express', 'PostgreSQL'],
    link: '#',
  },
  {
    title: 'AI-Powered Content Summarizer',
    description:
      'A web app that uses natural language processing to summarize long articles, papers, and documents into concise overviews.',
    tags: ['Next.js', 'Python', 'Flask', 'NLP'],
    link: '#',
  },
   {
    title: 'Fitness Tracker Mobile App',
    description:
      'A cross-platform mobile app to track workouts, set fitness goals, and monitor progress with detailed charts and statistics.',
    tags: ['React Native', 'Firebase', 'Chart.js'],
    link: '#',
  },
];

const skills = [
  'React',
  'Next.js',
  'Node.js',
  'TypeScript',
  'JavaScript (ES6+)',
  'Python',
  'HTML5 & CSS3',
  'Tailwind CSS',
  'Firebase',
  'MongoDB',
  'PostgreSQL',
  'Docker',
  'Git & GitHub',
  'Figma',
];

export function Portfolio() {
  return (
    <div className="portfolio-body">
      <main className="container mx-auto px-4 py-12 md:py-20">
        {/* Hero Section */}
        <section
          id="home"
          className="relative text-center flex flex-col items-center justify-center min-h-[80vh] md:min-h-screen"
        >
          <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)]"></div>

          <div className="relative mb-8">
             <Image
              src="https://devsuraj.in/_next/image?url=%2F_next%2Fstatic%2Fmedia%2FAvatar.3b22312a.png&w=256&q=75"
              alt="Suraj Kumar"
              width={180}
              height={180}
              className="rounded-full border-4 border-background shadow-lg mx-auto"
            />
            <div className="absolute bottom-2 right-2 bg-background p-2 rounded-full shadow-md">
              <div className="wave text-3xl">👋</div>
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 font-headline bg-gradient-to-r from-primary to-tertiary text-transparent bg-clip-text">
            Suraj Kumar
          </h1>
          <p className="text-lg md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Full-Stack Developer & UI/UX Enthusiast creating seamless and
            engaging digital experiences.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" asChild className="bg-gradient-to-r from-primary to-tertiary text-primary-foreground hover:saturate-150 transition-all duration-300">
                <Link href="#contact">
                    Get in Touch <Mail className="ml-2 h-5 w-5" />
                </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="https://devsuraj.in/Suraj-Kumar-Resume.pdf" target="_blank">
                Download CV <Download className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
          <a href="#about" className="absolute bottom-12 text-primary animate-bounce">
            <ArrowDown size={32} />
          </a>
        </section>

        {/* About Section */}
        <section id="about" className="py-20 md:py-32">
           <div className="text-center max-w-4xl mx-auto">
            <h2 className="section-title">About Me</h2>
            <p className="section-subtitle">
             I am a passionate Full-Stack Developer with a keen eye for design and a drive for creating intuitive, high-performance web applications. With a solid foundation in both front-end and back-end technologies, I thrive on turning complex problems into elegant solutions. My journey in tech has been fueled by a love for learning and a commitment to building products that not only work flawlessly but also delight users.
            </p>
          </div>
        </section>

        {/* Skills Section */}
        <section id="skills" className="py-20 md:py-32 bg-card border rounded-2xl">
           <div className="text-center">
            <h2 className="section-title">My Skills</h2>
            <p className="section-subtitle mb-12">Technologies and tools I work with.</p>
            <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
              {skills.map((skill) => (
                <div key={skill} className="skill-badge">
                  {skill}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Projects Section */}
        <section id="projects" className="py-20 md:py-32">
          <div className="text-center mb-16">
            <h2 className="section-title">Featured Projects</h2>
            <p className="section-subtitle">A selection of my recent work.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {projects.map((project) => (
              <Card key={project.title} className="project-card">
                 <CardContent className="p-6 flex flex-col h-full">
                    <h3 className="text-xl font-bold font-headline mb-2">{project.title}</h3>
                    <p className="text-muted-foreground flex-grow mb-4">{project.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {project.tags.map((tag) => (
                        <span key={tag} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">{tag}</span>
                        ))}
                    </div>
                    <Button variant="outline" asChild>
                        <Link href={project.link} target="_blank">View Project <Github className="ml-2 h-4 w-4" /></Link>
                    </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-20 md:py-32">
           <div className="text-center max-w-3xl mx-auto">
            <h2 className="section-title">Get In Touch</h2>
            <p className="section-subtitle mb-8">
              I'm always open to discussing new projects, creative ideas, or opportunities to be part of an amazing team. Feel free to reach out!
            </p>
            <a href="mailto:surajsk8558@gmail.com" className="text-2xl md:text-3xl font-bold text-primary hover:underline font-headline">
              surajsk8558@gmail.com
            </a>
            <div className="flex justify-center gap-6 mt-8">
              <Link href="https://twitter.com/surajsk_
" target="_blank" aria-label="Twitter">
                <Twitter className="social-icon" />
              </Link>
              <Link href="https://github.com/Suraj-sk" target="_blank" aria-label="GitHub">
                <Github className="social-icon" />
              </Link>
              <Link href="https://www.linkedin.com/in/suraj-sk" target="_blank" aria-label="LinkedIn">
                <Linkedin className="social-icon" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
