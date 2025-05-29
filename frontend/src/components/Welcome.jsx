import React, { useState, useEffect } from 'react'
import { Heart, CheckCircle, Activity, Shield, Users, ArrowRight, Sparkles } from 'lucide-react'

const Welcome = ({ user, onContinue }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const steps = [
    {
      icon: Heart,
      title: "Добро пожаловать в систему!",
      description: `Здравствуйте, ${user?.profile?.firstName}! Вы успешно подключились к персональной системе медицинского мониторинга.`,
      color: "text-red-500",
      bgColor: "bg-red-50"
    },
    {
      icon: Activity,
      title: "Мониторинг в реальном времени",
      description: "Ваши показатели здоровья будут отслеживаться круглосуточно с помощью современных IoT устройств.",
      color: "text-blue-500",
      bgColor: "bg-blue-50"
    },
    {
      icon: Shield,
      title: "Безопасность и конфиденциальность",
      description: "Все ваши медицинские данные защищены и доступны только вам и вашему лечащему врачу.",
      color: "text-green-500",
      bgColor: "bg-green-50"
    },
    {
      icon: Users,
      title: "Поддержка команды",
      description: "Наша медицинская команда готова помочь вам 24/7. При критических показателях вы получите немедленное уведомление.",
      color: "text-purple-500",
      bgColor: "bg-purple-50"
    }
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onContinue()
    }
  }

  const handleSkip = () => {
    onContinue()
  }

  const currentStepData = steps[currentStep]
  const Icon = currentStepData.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className={`max-w-2xl w-full transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Progress bar */}
          <div className="h-2 bg-gray-100">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          {/* Header */}
          <div className="text-center py-8 px-8">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <Heart className="h-16 w-16 text-red-500 animate-pulse" />
                <Sparkles className="h-6 w-6 text-yellow-400 absolute -top-1 -right-1 animate-bounce" />
              </div>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              MedMonitor
            </h1>
            <p className="text-gray-500 mt-1">Система персонального медицинского мониторинга</p>
          </div>

          {/* Content */}
          <div className="px-8 pb-8">
            <div className="text-center mb-8">
              <div className={`inline-flex items-center justify-center w-20 h-20 ${currentStepData.bgColor} rounded-full mb-6 transition-all duration-500`}>
                <Icon className={`h-10 w-10 ${currentStepData.color}`} />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {currentStepData.title}
              </h2>

              <p className="text-gray-600 text-lg leading-relaxed max-w-lg mx-auto">
                {currentStepData.description}
              </p>
            </div>

            {/* Step indicators */}
            <div className="flex justify-center space-x-2 mb-8">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index <= currentStep 
                      ? 'bg-blue-500 scale-110' 
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            {/* Features preview for last step */}
            {currentStep === steps.length - 1 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <Activity className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <div className="font-medium text-gray-900">Дашборд</div>
                  <div className="text-sm text-gray-600">Мониторинг в реальном времени</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <div className="font-medium text-gray-900">История</div>
                  <div className="text-sm text-gray-600">Полная медицинская карта</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-xl">
                  <Users className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <div className="font-medium text-gray-900">Команда</div>
                  <div className="text-sm text-gray-600">Поддержка специалистов</div>
                </div>
              </div>
            )}

            {/* User info */}
            <div className="bg-gray-50 rounded-xl p-4 mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {user?.profile?.firstName?.charAt(0) || 'П'}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {user?.fullName || 'Пациент'}
                  </div>
                  <div className="text-sm text-gray-500">
                    ID: #{user?.id || '1'} • Подключено: {new Date().toLocaleDateString('ru-RU')}
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                onClick={handleNext}
                className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
              >
                <span>
                  {currentStep === steps.length - 1 ? 'Начать работу' : 'Далее'}
                </span>
                <ArrowRight className="h-5 w-5" />
              </button>

              {currentStep < steps.length - 1 && (
                <button
                  onClick={handleSkip}
                  className="sm:w-32 px-6 py-4 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Пропустить
                </button>
              )}
            </div>

            {/* Additional info */}
            <div className="mt-6 text-center text-xs text-gray-500">
              <p>
                Нажимая "Начать работу", вы соглашаетесь с{' '}
                <a href="#" className="text-blue-600 hover:underline">условиями использования</a>
                {' '}и{' '}
                <a href="#" className="text-blue-600 hover:underline">политикой конфиденциальности</a>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom decoration */}
        <div className="text-center mt-8">
          <div className="text-sm text-gray-400">
            Версия системы: 2.0.0 • Разработано для медицинских учреждений
          </div>
        </div>
      </div>
    </div>
  )
}

export default Welcome