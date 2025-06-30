import OpenAI from 'openai'

// Initialize OpenAI client lazily to avoid build-time errors
let openai: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured')
    }
    openai = new OpenAI({ apiKey })
  }
  return openai
}

export interface CoverLetterRequest {
  jobTitle: string
  company: string
  jobDescription?: string
  userBackground?: string
  userSkills?: string[]
  tone?: 'professional' | 'friendly' | 'enthusiastic'
}

export interface CVOptimizationRequest {
  jobTitle: string
  jobDescription?: string
  currentCV?: string
  targetKeywords?: string[]
}

export class CoverLetterGenerator {
  static async generateCoverLetter(request: CoverLetterRequest): Promise<string> {
    const { jobTitle, company, jobDescription, userBackground, userSkills, tone = 'professional' } = request

    const prompt = `
Generate a professional cover letter for the following job application:

Job Title: ${jobTitle}
Company: ${company}
Job Description: ${jobDescription || 'Not provided'}
User Background: ${userBackground || 'Recent graduate with relevant coursework'}
User Skills: ${userSkills?.join(', ') || 'Various technical and soft skills'}
Tone: ${tone}

Please create a compelling cover letter that:
1. Opens with a strong introduction that captures attention
2. Highlights relevant experience and skills that match the job requirements
3. Shows enthusiasm for the company and role
4. Includes specific examples where possible
5. Closes with a call to action
6. Maintains a ${tone} tone throughout
7. Is approximately 3-4 paragraphs long

Format the response as clean text without any markdown formatting.
`

    try {
      const completion = await getOpenAIClient().chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a professional career coach and expert cover letter writer. Create compelling, personalized cover letters that help candidates stand out.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })

      return completion.choices[0]?.message?.content || 'Unable to generate cover letter'
    } catch (error) {
      console.error('Error generating cover letter:', error)
      throw new Error('Failed to generate cover letter')
    }
  }

  static async optimizeCV(request: CVOptimizationRequest): Promise<{
    suggestions: string[]
    optimizedSections: string[]
    keywords: string[]
  }> {
    const { jobTitle, jobDescription, currentCV, targetKeywords } = request

    const prompt = `
Analyze this CV against the job requirements and provide optimization suggestions:

Job Title: ${jobTitle}
Job Description: ${jobDescription || 'Not provided'}
Current CV Content: ${currentCV || 'Not provided'}
Target Keywords: ${targetKeywords?.join(', ') || 'None specified'}

Please provide:
1. A list of 5-7 specific suggestions to improve the CV for this job
2. 3-4 optimized sections or bullet points that could be added/improved
3. 8-10 relevant keywords that should be included in the CV

Format your response as JSON with the following structure:
{
  "suggestions": ["suggestion 1", "suggestion 2", ...],
  "optimizedSections": ["section 1", "section 2", ...],
  "keywords": ["keyword1", "keyword2", ...]
}
`

    try {
      const completion = await getOpenAIClient().chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a professional career coach and CV optimization expert. Provide specific, actionable advice to help candidates tailor their CVs for specific jobs.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1200,
        temperature: 0.6
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        throw new Error('No response from AI')
      }

      try {
        return JSON.parse(response)
      } catch {
        // Fallback if JSON parsing fails
        return {
          suggestions: [
            'Tailor your professional summary to match the job requirements',
            'Include relevant keywords from the job description',
            'Quantify your achievements with specific metrics',
            'Highlight technical skills that match the role',
            'Ensure your experience section emphasizes relevant accomplishments'
          ],
          optimizedSections: [
            'Enhanced professional summary with role-specific keywords',
            'Skills section aligned with job requirements',
            'Achievement-focused experience bullets with metrics'
          ],
          keywords: targetKeywords || ['leadership', 'communication', 'problem-solving', 'teamwork']
        }
      }
    } catch (error) {
      console.error('Error optimizing CV:', error)
      throw new Error('Failed to optimize CV')
    }
  }

  static async extractKeywords(jobDescription: string): Promise<string[]> {
    const prompt = `
Extract the most important keywords and skills from this job description that a candidate should include in their CV and cover letter:

Job Description:
${jobDescription}

Return only a JSON array of 10-15 keywords, like: ["keyword1", "keyword2", ...]
`

    try {
      const completion = await getOpenAIClient().chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.3
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        return []
      }

      try {
        return JSON.parse(response)
      } catch {
        // Fallback keyword extraction
        const words = jobDescription.toLowerCase().split(/\s+/)
        const keywords = words.filter(word => 
          word.length > 3 && 
          !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'].includes(word)
        )
        return [...new Set(keywords)].slice(0, 10)
      }
    } catch (error) {
      console.error('Error extracting keywords:', error)
      return []
    }
  }
}