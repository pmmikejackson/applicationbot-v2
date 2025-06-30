'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface EmailConfigForm {
  provider: string
  emailAddress: string
  password: string
  senderFilters: string[]
  subjectFilters: string[]
}

const EMAIL_PROVIDERS = [
  { id: 'gmail', name: 'Gmail', domains: ['gmail.com'] },
  { id: 'outlook', name: 'Outlook/Hotmail', domains: ['outlook.com', 'hotmail.com', 'live.com'] },
  { id: 'icloud', name: 'iCloud', domains: ['icloud.com', 'me.com', 'mac.com'] },
  { id: 'yahoo', name: 'Yahoo', domains: ['yahoo.com'] },
  { id: 'other', name: 'Other IMAP Provider', domains: [] }
]

const DEFAULT_JOB_SENDERS = [
  'noreply@linkedin.com',
  'jobalerts-noreply@linkedin.com',
  'noreply@indeed.com',
  'no-reply@indeed.com',
  'team@builtin.com',
  'no-reply@ziprecruiter.com',
  'noreply@ziprecruiter.com'
]

const DEFAULT_SUBJECT_FILTERS = [
  '*job alert*',
  '*new job*',
  '*job opportunity*',
  '*application*',
  '*position*',
  '*career*'
]

export default function EmailSetup() {
  const { data: session } = useSession()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  
  const [formData, setFormData] = useState<EmailConfigForm>({
    provider: '',
    emailAddress: '',
    password: '',
    senderFilters: [...DEFAULT_JOB_SENDERS],
    subjectFilters: [...DEFAULT_SUBJECT_FILTERS]
  })

  const [errors, setErrors] = useState<string[]>([])

  const detectProvider = (email: string) => {
    const domain = email.split('@')[1]?.toLowerCase()
    if (!domain) return ''
    
    for (const provider of EMAIL_PROVIDERS) {
      if (provider.domains.includes(domain)) {
        return provider.id
      }
    }
    return 'other'
  }

  const handleEmailChange = (email: string) => {
    setFormData(prev => ({
      ...prev,
      emailAddress: email,
      provider: detectProvider(email)
    }))
  }

  const handleTestConnection = async () => {
    setIsLoading(true)
    setTestResult(null)
    setErrors([])

    try {
      const response = await fetch('/api/email/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: formData.provider,
          emailAddress: formData.emailAddress,
          password: formData.password
        })
      })

      const data = await response.json()

      if (response.ok) {
        setTestResult({ success: true, message: 'Connection successful!' })
      } else {
        setTestResult({ success: false, message: data.error || 'Connection failed' })
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Network error occurred' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveConfiguration = async () => {
    setIsLoading(true)
    setErrors([])

    try {
      const response = await fetch('/api/email/configure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/dashboard?setup=complete')
      } else {
        setErrors([data.error || 'Configuration failed'])
      }
    } catch (error) {
      setErrors(['Network error occurred'])
    } finally {
      setIsLoading(false)
    }
  }

  const addSenderFilter = () => {
    setFormData(prev => ({
      ...prev,
      senderFilters: [...prev.senderFilters, '']
    }))
  }

  const updateSenderFilter = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      senderFilters: prev.senderFilters.map((filter, i) => i === index ? value : filter)
    }))
  }

  const removeSenderFilter = (index: number) => {
    setFormData(prev => ({
      ...prev,
      senderFilters: prev.senderFilters.filter((_, i) => i !== index)
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Email Setup</h1>
            <p className="mt-2 text-gray-600">
              Connect your email to start tracking job applications
            </p>
            
            {/* Progress indicator */}
            <div className="mt-6">
              <div className="flex items-center">
                {[1, 2, 3].map((stepNum) => (
                  <div key={stepNum} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step >= stepNum
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {stepNum}
                    </div>
                    {stepNum < 3 && (
                      <div
                        className={`w-16 h-1 mx-2 ${
                          step > stepNum ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-sm text-gray-500">
                <span>Email Account</span>
                <span>Test Connection</span>
                <span>Configure Filters</span>
              </div>
            </div>
          </div>

          {errors.length > 0 && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <ul className="text-sm text-red-600">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Step 1: Email Account */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email Provider
                </label>
                <select
                  value={formData.provider}
                  onChange={(e) => setFormData(prev => ({ ...prev, provider: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select provider</option>
                  {EMAIL_PROVIDERS.map(provider => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.emailAddress}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  App Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="App-specific password"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Use an app-specific password, not your regular email password
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  disabled={!formData.provider || !formData.emailAddress || !formData.password}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Test Connection */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900">Test Email Connection</h3>
                <p className="mt-2 text-gray-600">
                  Let's verify we can connect to your email account
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">
                  <p><strong>Provider:</strong> {EMAIL_PROVIDERS.find(p => p.id === formData.provider)?.name}</p>
                  <p><strong>Email:</strong> {formData.emailAddress}</p>
                </div>
              </div>

              {testResult && (
                <div
                  className={`p-4 rounded-md ${
                    testResult.success
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <p
                    className={`text-sm ${
                      testResult.success ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {testResult.message}
                  </p>
                </div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Back
                </button>
                <div className="space-x-3">
                  <button
                    onClick={handleTestConnection}
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Testing...' : 'Test Connection'}
                  </button>
                  {testResult?.success && (
                    <button
                      onClick={() => setStep(3)}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Continue
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Configure Filters */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Email Filters</h3>
                <p className="mt-2 text-gray-600">
                  Configure which emails to monitor for job listings
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Sender Email Addresses
                </label>
                <div className="space-y-2">
                  {formData.senderFilters.map((filter, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={filter}
                        onChange={(e) => updateSenderFilter(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="noreply@jobsite.com"
                      />
                      <button
                        onClick={() => removeSenderFilter(index)}
                        className="p-2 text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addSenderFilter}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    + Add sender filter
                  </button>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleSaveConfiguration}
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Complete Setup'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}