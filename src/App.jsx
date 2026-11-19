
import './App.css'
import TaskForm from './components/TaskForm'
import TaskList from './components/TaskList'
import Login from './components/auth/Login'
import { supabase } from './supabase'
import { useState, useEffect } from 'react'

function App() {
  const [tasks, setTasks] = useState([])
  const [tasksLoading, setTasksLoading] = useState(true)
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Haftalık hedef
  const [weeklyTarget, setWeeklyTarget] = useState(20)
  const [goalLoading, setGoalLoading] = useState(true)
  const [goalInput, setGoalInput] = useState('20')

  useEffect(() => {
    const fetchGoal = async () => {
      if (!session?.user?.id) {
        setGoalLoading(false)
        return
      }

      setGoalLoading(true)

      const { data, error } = await supabase
        .from('user_goals')
        .select('weekly_target')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (error) {
        console.error('Hedef yüklenemedi:', error.message)
        setGoalLoading(false)
        return
      }

      if (data) {
        setWeeklyTarget(data.weekly_target)
        setGoalInput(String(data.weekly_target))
      } else {
        const { data: newGoal, error: insertError } = await supabase
          .from('user_goals')
          .insert({
            user_id: session.user.id,
            weekly_target: 20
          })
          .select('weekly_target')
          .single()

        if (insertError) {
          console.error('Hedef oluşturulamadı:', insertError.message)
        } else if (newGoal) {
          setWeeklyTarget(newGoal.weekly_target)
          setGoalInput(String(newGoal.weekly_target))
        }
      }

      setGoalLoading(false)
    }

    fetchGoal()
  }, [session])

  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [activePage, setActivePage] = useState('dashboard')
  const [activeMenu, setActiveMenu] = useState('dashboard')
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [activityPeriod, setActivityPeriod] = useState('weekly')
  const [userName, setUserName] = useState('TaskFlow Kullanıcısı')
  const [userEmail, setUserEmail] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)

  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [selectedAvatarName, setSelectedAvatarName] = useState('')

  const [activityMonth, setActivityMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const [activityYear, setActivityYear] = useState(new Date().getFullYear())
  const [newPassword, setNewPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notification, setNotification] = useState(null)

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
  }

  const saveGoal = async () => {
    const target = Number(goalInput)

    if (!Number.isInteger(target) || target < 1) {
      showNotification('Haftalık hedef en az 1 görev olmalıdır.', 'warning')
      return
    }

    if (!session?.user?.id) return

    const { data: existingGoal, error: fetchError } = await supabase
      .from('user_goals')
      .select('id')
      .eq('user_id', session.user.id)
      .maybeSingle()

    if (fetchError) {
      console.error('Hedef kontrol edilemedi:', fetchError.message)
      showNotification('Hedef kontrol edilemedi.', 'error')
      return
    }

    let result

    if (existingGoal) {
      result = await supabase
        .from('user_goals')
        .update({ weekly_target: target })
        .eq('user_id', session.user.id)
        .select('weekly_target')
        .single()
    } else {
      result = await supabase
        .from('user_goals')
        .insert({
          user_id: session.user.id,
          weekly_target: target
        })
        .select('weekly_target')
        .single()
    }

    if (result.error) {
      console.error('Hedef kaydedilemedi:', result.error.message)
      showNotification('Haftalık hedef kaydedilemedi.', 'error')
      return
    }

    setWeeklyTarget(result.data.weekly_target)
    setGoalInput(String(result.data.weekly_target))
    showNotification('Haftalık hedefin kaydedildi!')
  }

  useEffect(() => {
    if (!notification) return

    const timer = setTimeout(() => {
      setNotification(null)
    }, 4000)

    return () => clearTimeout(timer)
  }, [notification])

  const getAvatarPath = (url) => {
    if (!url) return null

    const marker = '/storage/v1/object/public/avatars/'
    const pathIndex = url.indexOf(marker)

    if (pathIndex === -1) return null

    try {
      return decodeURIComponent(url.slice(pathIndex + marker.length))
    } catch {
      return url.slice(pathIndex + marker.length)
    }
  }


  // Oturum kontrolü
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthLoading(false)
    })

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Kullanıcı profil bilgileri
  useEffect(() => {
    if (session?.user) {
      setUserName(
        session.user.user_metadata?.full_name || 'TaskFlow Kullanıcısı'
      )
      setUserEmail(session.user.email || '')
      setAvatarUrl(session.user.user_metadata?.avatar_url || '')
    } else {
      setUserName('TaskFlow Kullanıcısı')
      setUserEmail('')
      setAvatarUrl('')
    }
  }, [session])

  // Profil bilgilerini kaydet
  const saveProfile = async () => {
    if (!session) return

    if (!userName.trim()) {
      showNotification('Ad alanı boş bırakılamaz.', 'warning')
      return
    }

    setProfileSaving(true)

    const { data, error } = await supabase.auth.updateUser({
      data: {
        full_name: userName.trim()
      }
    })

    setProfileSaving(false)

    if (error) {
      console.error('Profil güncellenemedi:', error.message)
      showNotification('Profil kaydedilirken bir hata oluştu.', 'error')
      return
    }

    setUserName(data.user.user_metadata?.full_name || 'TaskFlow Kullanıcısı')
    setUserEmail(data.user.email || '')
    showNotification('Profil bilgilerin kaydedildi!')
  }

  // Şifre değiştirme
  const changePassword = async () => {
    if (newPassword.length < 6) {
      showNotification('Şifre en az 6 karakter olmalıdır.', 'warning')
      return
    }

    setPasswordSaving(true)

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    setPasswordSaving(false)

    if (error) {
      showNotification('Şifre değiştirilemedi: ' + error.message, 'error')
      return
    }

    setNewPassword('')
    showNotification('Şifren başarıyla değiştirildi!')
  }

  // Profil fotoğrafını yükle veya değiştir
  const uploadAvatar = async (file) => {
    if (!file || !session) return

    if (!file.type.startsWith('image/')) {
      showNotification('Lütfen bir resim dosyası seç.', 'warning')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      showNotification('Fotoğraf boyutu en fazla 2 MB olabilir.', 'warning')
      return
    }

    setAvatarUploading(true)

    const oldAvatarUrl = avatarUrl
    const fileExtension = file.name.split('.').pop().toLowerCase()
    const filePath = `${session.user.id}/${Date.now()}.${fileExtension}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file)

    if (uploadError) {
      setAvatarUploading(false)
      console.error('Fotoğraf yüklenemedi:', uploadError.message)
      showNotification('Fotoğraf yüklenemedi: ' + uploadError.message, 'error')
      return
    }

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    const publicUrl = data.publicUrl

    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        avatar_url: publicUrl
      }
    })

    if (updateError) {
      await supabase.storage.from('avatars').remove([filePath])
      setAvatarUploading(false)
      showNotification('Profil fotoğrafı kaydedilemedi: ' + updateError.message, 'error')
      return
    }

    setAvatarUrl(publicUrl)
    setSelectedAvatarName(file.name)
    setAvatarUploading(false)

    const oldFilePath = getAvatarPath(oldAvatarUrl)

    if (oldFilePath && oldFilePath !== filePath) {
      const { error: removeError } = await supabase.storage
        .from('avatars')
        .remove([oldFilePath])

      if (removeError) {
        console.error('Eski fotoğraf temizlenemedi:', removeError.message)
      }
    }

    showNotification('Profil fotoğrafın başarıyla güncellendi!')
  }

  // Profil fotoğrafını kaldır
  const removeAvatar = async () => {
    if (!session || !avatarUrl) return

    const confirmed = window.confirm(
      'Profil fotoğrafını kaldırmak istediğine emin misin?'
    )

    if (!confirmed) return

    setAvatarUploading(true)

    const oldAvatarUrl = avatarUrl

    const { error } = await supabase.auth.updateUser({
      data: {
        avatar_url: null
      }
    })

    if (error) {
      setAvatarUploading(false)
      showNotification('Fotoğraf kaldırılamadı: ' + error.message, 'error')
      return
    }

    setAvatarUrl('')
    setSelectedAvatarName('')
    setAvatarUploading(false)

    const oldFilePath = getAvatarPath(oldAvatarUrl)

    if (oldFilePath) {
      const { error: removeError } = await supabase.storage
        .from('avatars')
        .remove([oldFilePath])

      if (removeError) {
        console.error('Storage fotoğrafı silinemedi:', removeError.message)
      }
    }

    showNotification('Profil fotoğrafın kaldırıldı!')
  }

  // Supabase'den görevleri yükle
  useEffect(() => {
    const fetchTasks = async () => {
      if (!session) {
        setTasks([])
        setTasksLoading(false)
        return
      }

      setTasksLoading(true)

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Görevler yüklenemedi:', error.message)
        showNotification('Görevler yüklenirken bir hata oluştu.', 'error')
        setTasks([])
      } else {
        const formattedTasks = data.map((task) => ({
          ...task,
          dueDate: task.due_date || ''
        }))

        setTasks(formattedTasks)
      }

      setTasksLoading(false)
    }

    if (!authLoading) {
      fetchTasks()
    }
  }, [session, authLoading])

  // Yeni görev ekle
  const addTask = async (newTask) => {
    if (!session) return

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        completed: false,
        due_date: newTask.dueDate || null,
        user_id: session.user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Görev eklenemedi:', error.message)
      showNotification('Görev eklenirken bir hata oluştu.', 'error')
      return
    }

    setTasks((prevTasks) => [
      { ...data, dueDate: data.due_date || '' },
      ...prevTasks
    ])

    showNotification('Görev başarıyla eklendi!')
  }

  // Görev sil
  const deleteTask = async (id) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id)

    if (error) {
      console.error('Görev silinemedi:', error.message)
      showNotification('Görev silinirken bir hata oluştu.', 'error')
      return false
    }

    setTasks((prevTasks) =>
      prevTasks.filter((task) => task.id !== id)
    )

    if (editingTaskId === id) {
      setEditingTaskId(null)
    }

    showNotification('Görev başarıyla silindi!')
    return true
  }

  // Görev tamamlandı durumunu değiştir
  const toggleTask = async (id) => {
    console.log('toggleTask çalıştı:', id)

    const task = tasks.find((task) => task.id === id)

    if (!task) return

    const { data, error } = await supabase
      .from('tasks')
      .update({
        completed: !task.completed,
        completed_at: !task.completed
          ? new Date().toISOString()
          : null
      })
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select()
      .single()

    console.log('Görev güncelleme sonucu:', data)
    console.log('Görev güncelleme hatası:', error)
    console.log('Tamamlanma tarihi:', data?.completed_at)

    if (error) {
      console.error('Görev güncellenemedi:', error.message)
      showNotification('Görev durumu değiştirilirken bir hata oluştu.', 'error')
      return
    }

    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === id
          ? { ...data, dueDate: data.due_date || '' }
          : task
      )
    )

    showNotification(
      data.completed
        ? 'Görev tamamlandı!'
        : 'Görev yeniden aktif hale getirildi!'
    )
  }
  // Düzenlenecek görevi seç
  const editTask = (id) => {
    setEditingTaskId(id)
    setActivePage('dashboard')
  }

  // Görevi güncelle
  const updateTask = async (updatedTask) => {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        title: updatedTask.title,
        description: updatedTask.description,
        priority: updatedTask.priority,
        due_date: updatedTask.dueDate || null
      })
      .eq('id', updatedTask.id)
      .eq('user_id', session.user.id)
      .select()
      .single()

    if (error) {
      console.error('Görev güncellenemedi:', error.message)
      showNotification('Görev güncellenirken bir hata oluştu.', 'error')
      return
    }

    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === updatedTask.id
          ? { ...data, dueDate: data.due_date || '' }
          : task
      )
    )

    setEditingTaskId(null)
    showNotification('Görev başarıyla güncellendi!')
  }

  const editingTask = tasks.find(
    (task) => task.id === editingTaskId
  )

  // Görev sayıları
  const totalTasks = tasks.length

  const activeTasks = tasks.filter(
    (task) => !task.completed
  ).length

  const completedTasks = tasks.filter(
    (task) => task.completed
  ).length
  // Bu haftanın tamamlanan görev sayısı
  const now = new Date()
  const currentDay = (now.getDay() + 6) % 7

  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - currentDay)
  weekStart.setHours(0, 0, 0, 0)

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 7)

  const weeklyCompletedTasks = tasks.filter((task) => {
    if (!task.completed || !task.completed_at) return false

    const completedDate = new Date(task.completed_at)

    return completedDate >= weekStart && completedDate < weekEnd
  }).length

  // Haftalık hedef ilerleme yüzdesi
  const weeklyGoalPercentage = weeklyTarget > 0
    ? Math.min(Math.round((weeklyCompletedTasks / weeklyTarget) * 100), 100)
    : 0
  // Zamanında tamamlanan görevler
  const tasksWithDueDate = tasks.filter(
    (task) => task.completed && task.dueDate && task.completed_at
  )

  const onTimeTasks = tasksWithDueDate.filter((task) => {
    const dueDate = new Date(task.dueDate + 'T23:59:59.999')
    const completedDate = new Date(task.completed_at)

    return completedDate <= dueDate
  }).length

  // Zamanında tamamlama yüzdesi
  const onTimePercentage = tasksWithDueDate.length > 0
    ? Math.round((onTimeTasks / tasksWithDueDate.length) * 100)
    : 0
  // Geciken görevler
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const overdueTasks = tasks.filter((task) => {
    return (
      task.dueDate &&
      new Date(task.dueDate + 'T00:00:00') < today &&
      !task.completed
    )
  }).length
  // Son 7 günün görev aktivitesi
  // Görev tamamlama aktivitesi
  const activityData = (() => {
    const [monthYear, selectedMonth] = activityMonth.split('-').map(Number)
    const selectedYear = activityPeriod === 'monthly' ? activityYear : monthYear
    const getCompletedCount = (startDate, endDate) => {
      return tasks.filter((task) => {
        if (!task.completed_at) return false

        const completedDate = new Date(task.completed_at)

        return completedDate >= startDate && completedDate < endDate
      }).length
    }

    // GÜNLÜK: Seçilen ayın günleri
    if (activityPeriod === 'daily') {
      const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate()

      return Array.from({ length: daysInMonth }, (_, index) => {
        const day = index + 1

        return {
          day: String(day),
          count: getCompletedCount(
            new Date(selectedYear, selectedMonth - 1, day),
            new Date(selectedYear, selectedMonth - 1, day + 1)
          )
        }
      })
    }

    // HAFTALIK: Seçilen ayın haftaları
    if (activityPeriod === 'weekly') {
      const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate()
      const weekCount = Math.ceil(daysInMonth / 7)

      return Array.from({ length: weekCount }, (_, index) => {
        const startDay = index * 7 + 1
        const endDay = Math.min(startDay + 7, daysInMonth + 1)

        return {
          day: `${index + 1}. hf`,
          count: getCompletedCount(
            new Date(selectedYear, selectedMonth - 1, startDay),
            new Date(selectedYear, selectedMonth - 1, endDay)
          )
        }
      })
    }

    // AYLIK: Seçilen yılın ayları
    if (activityPeriod === 'monthly') {
      return Array.from({ length: 12 }, (_, index) => ({
        day: new Date(selectedYear, index, 1).toLocaleDateString('tr-TR', { month: 'short' }),
        count: getCompletedCount(
          new Date(selectedYear, index, 1),
          new Date(selectedYear, index + 1, 1)
        )
      }))
    }

    // YILLIK: 2026'dan itibaren
    const currentYear = new Date().getFullYear()

    return Array.from(
      { length: Math.max(1, currentYear - 2026 + 1) },
      (_, index) => ({
        day: String(2026 + index),
        count: getCompletedCount(
          new Date(2026 + index, 0, 1),
          new Date(2027 + index, 0, 1)
        )
      })
    )
  })()
  // Tamamlanma oranı
  const completionRate =
    totalTasks === 0
      ? 0
      : Math.round((completedTasks / totalTasks) * 100)

  // Öncelik sayılarını hesapla
  const highPriorityTasks = tasks.filter(
    (task) => task.priority === 'high'
  ).length

  const mediumPriorityTasks = tasks.filter(
    (task) => task.priority === 'medium'
  ).length

  const lowPriorityTasks = tasks.filter(
    (task) => task.priority === 'low'
  ).length

  const getPercentage = (count) =>
    totalTasks === 0 ? 0 : Math.round((count / totalTasks) * 100)

  // Halka grafik renklerini oluştur
  const createDonutGradient = (items) => {
    const total = items.reduce((sum, item) => sum + item.count, 0)

    if (total === 0) {
      return '#eeeef5'
    }

    let currentPercentage = 0

    const gradientParts = items.map((item) => {
      const start = currentPercentage
      currentPercentage += (item.count / total) * 100

      return `${item.color} ${start}% ${currentPercentage}%`
    })

    return `conic-gradient(${gradientParts.join(', ')})`
  }

  // Arama ve filtreleme
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase())

    const matchesStatus =
      filter === 'active'
        ? !task.completed
        : filter === 'completed'
          ? task.completed
          : true

    const matchesPriority =
      priorityFilter === 'all' || task.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  const formattedDate = new Date().toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long'
  })

  // Sayfa değiştirme yardımcıları
  const openDashboard = () => {
    setActivePage('dashboard')
    setActiveMenu('dashboard')
    setFilter('all')
    setPriorityFilter('all')
    setSearchTerm('')
  }

  const openAllTasks = () => {
    setActivePage('dashboard')
    setActiveMenu('allTasks')
    setFilter('all')
    setPriorityFilter('all')
    setSearchTerm('')
  }

  const openCompletedTasks = () => {
    setActivePage('dashboard')
    setActiveMenu('completed')
    setFilter('completed')
    setPriorityFilter('all')
    setSearchTerm('')
  }

  const openStatistics = () => {
    setActivePage('statistics')
    setActiveMenu('statistics')
  }
  if (authLoading) {
    return <div>Yükleniyor...</div>
  }

  if (!session) {
    return <Login />
  }

  if (tasksLoading) {
    return <div>Görevler yükleniyor...</div>
  }

  return (
    <div className="dashboard-layout">

      {/* BİLDİRİM */}
      {notification && (
        <div className={`toast-notification ${notification.type}`}>
          <span className="toast-icon">
            {notification.type === 'success'
              ? '✓'
              : notification.type === 'error'
                ? '✕'
                : '⚠'}
          </span>

          <span>{notification.message}</span>

          <button
            type="button"
            onClick={() => setNotification(null)}
            aria-label="Bildirimi kapat"
          >
            ×
          </button>
        </div>
      )}

      {/* SOL MENÜ */}

      {/* MOBİL MENÜ BUTONU */}
      <button
        className="mobile-menu-button"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? '✕' : '☰'}
      </button>

      {/* MOBİL MENÜ ARKA PLANI */}
      {mobileMenuOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* SOL MENÜ */}
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-icon">✓</div>
          <h1>TaskFlow</h1>
          <p>Planla • Yönet • Başar</p>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeMenu === 'dashboard' ? 'active' : ''}`}
            onClick={() => {
              openDashboard()
              setMobileMenuOpen(false)
            }}
          >
            <span>⌂</span>
            Dashboard
          </button>

          <button
            className={`nav-item ${activeMenu === 'allTasks' ? 'active' : ''}`}
            onClick={() => {
              openAllTasks()
              setMobileMenuOpen(false)
            }}
          >
            <span>☷</span>
            Tüm Görevler
          </button>

          <button
            className={`nav-item ${activeMenu === 'completed' ? 'active' : ''}`}
            onClick={() => {
              openCompletedTasks()
              setMobileMenuOpen(false)
            }}
          >
            <span>✓</span>
            Tamamlananlar
          </button>

          <button
            className={`nav-item ${activeMenu === 'statistics' ? 'active' : ''}`}
            onClick={() => {
              openStatistics()
              setMobileMenuOpen(false)
            }}
          >
            <span>▥</span>
            İstatistikler
          </button>
        </nav>

        <div className="sidebar-footer">
          <p>"Daha organize<br />bir sen!"</p>
          <span>🚀</span>
        </div>
      </aside>


      {/* ANA İÇERİK */}
      <main className="dashboard-main">

        {/* ÜST BAR */}
        <div className="topbar">
          <div className="topbar-date">
            <span>📅</span>
            {formattedDate}
          </div>

          <div className="profile-container">
            <button
              type="button"
              className="user-avatar"
              onClick={() => setIsProfileOpen((prev) => !prev)}
              title="Profilim"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profil fotoğrafı" />
              ) : (
                userName
                  .trim()
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0]?.toUpperCase())
                  .join('') || '👤'
              )}
            </button>

            {isProfileOpen && (
              <div className="profile-dropdown">
                <div className="profile-heading">
                  <div className="profile-heading-avatar">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Profil fotoğrafı" />
                    ) : (
                      userName
                        .trim()
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((part) => part[0]?.toUpperCase())
                        .join('') || '👤'
                    )}
                  </div>

                  <div className="profile-heading-info">
                    <h3>{userName}</h3>
                    <p>{userEmail}</p>
                  </div>
                </div>

                <div className="avatar-upload-section">
                  <p>Profil Fotoğrafı</p>

                  <input
                    id="avatar-file"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0]

                      if (file) {
                        setSelectedAvatarName(file.name)
                        uploadAvatar(file)
                      }

                      e.target.value = ''
                    }}
                    disabled={avatarUploading}
                  />

                  <label
                    htmlFor="avatar-file"
                    style={{
                      display: 'inline-block',
                      padding: '9px 15px',
                      backgroundColor: '#6c63ff',
                      color: 'white',
                      borderRadius: '8px',
                      cursor: avatarUploading ? 'not-allowed' : 'pointer',
                      opacity: avatarUploading ? 0.6 : 1,
                      fontSize: '13px',
                      pointerEvents: avatarUploading ? 'none' : 'auto'
                    }}
                  >
                    {avatarUploading
                      ? 'İşlem yapılıyor...'
                      : avatarUrl
                        ? '📷 Fotoğrafı Değiştir'
                        : '📷 Fotoğraf Seç'}
                  </label>

                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={removeAvatar}
                      disabled={avatarUploading}
                      style={{
                        display: 'inline-block',
                        marginLeft: '8px',
                        padding: '9px 12px',
                        backgroundColor: '#fff0f0',
                        color: '#d64545',
                        border: '1px solid #ffdada',
                        borderRadius: '8px',
                        cursor: avatarUploading ? 'not-allowed' : 'pointer',
                        opacity: avatarUploading ? 0.6 : 1,
                        fontSize: '13px'
                      }}
                    >
                      Fotoğrafı Kaldır
                    </button>
                  )}

                  {selectedAvatarName && (
                    <p
                      style={{
                        fontSize: '12px',
                        marginTop: '8px',
                        overflowWrap: 'anywhere'
                      }}
                    >
                      Seçilen dosya: {selectedAvatarName}
                    </p>
                  )}
                </div>

                <input
                  type="text"
                  className="profile-input"
                  placeholder="Adınızı girin"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                />

                <input
                  type="email"
                  className="profile-input"
                  placeholder="E-posta adresiniz"
                  value={userEmail}
                  readOnly
                />

                <div className="profile-stats">
                  <div>
                    <strong>{totalTasks}</strong>
                    <span>Toplam</span>
                  </div>

                  <div>
                    <strong>{activeTasks}</strong>
                    <span>Devam Eden</span>
                  </div>

                  <div>
                    <strong>{completedTasks}</strong>
                    <span>Tamamlanan</span>
                  </div>
                </div>

                <input
                  type="password"
                  className="profile-input"
                  placeholder="Yeni şifren (en az 6 karakter)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />

                <button
                  type="button"
                  className="profile-close"
                  onClick={changePassword}
                  disabled={passwordSaving}
                >
                  {passwordSaving ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
                </button>

                <button
                  type="button"
                  className="profile-close"
                  onClick={saveProfile}
                  disabled={profileSaving}
                >
                  {profileSaving ? 'Kaydediliyor...' : 'Profili Kaydet'}
                </button>

                <button
                  type="button"
                  className="profile-logout"
                  onClick={async () => {
                    await supabase.auth.signOut()
                    setIsProfileOpen(false)
                  }}
                >
                  Çıkış Yap
                </button>
              </div>
            )}
          </div>
        </div>

        {/* DASHBOARD SAYFASI */}
        {activePage === 'dashboard' && activeMenu === 'dashboard' && (
          <>
            <section className="welcome-banner">
              <div>
                <h2>👋 Merhaba!, {userName}</h2>
                <p>Bugünün görevlerini birlikte halledelim. 💪</p>
              </div>
            </section>

            <div className="stats-grid">
              <div className="stat-card total-card">
                <div className="stat-icon">▦</div>
                <div>
                  <p>Toplam Görev</p>
                  <h2>{totalTasks}</h2>
                </div>
              </div>

              <div className="stat-card active-card">
                <div className="stat-icon">▶</div>
                <div>
                  <p>Devam Eden</p>
                  <h2>{activeTasks}</h2>
                </div>
              </div>

              <div className="stat-card completed-card">
                <div className="stat-icon">✓</div>
                <div>
                  <p>Tamamlanan</p>
                  <h2>{completedTasks}</h2>
                </div>
              </div>

              <div className="stat-card overdue-card">
                <div className="stat-icon">◷</div>
                <div>
                  <p>Geciken</p>
                  <h2>{overdueTasks}</h2>
                </div>
              </div>
            </div>

            <section className="progress-section">
              <div className="progress-header">
                <p>🎯 Görev Tamamlama Oranı</p>
                <span>%{completionRate}</span>
              </div>

              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${completionRate}%` }}
                ></div>
              </div>
            </section>


            {/* SON EKLENEN GÖREVLER VE ÖNCELİKLİ GÖREVLER */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: '20px',
              marginTop: '24px',
              alignItems: 'stretch'
            }}>

              {/* SON EKLENEN GÖREVLER */}
              <section style={{
                background: '#fff',
                borderRadius: '18px',
                padding: '24px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                minWidth: 0
              }}>
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '17px', marginBottom: '6px' }}>
                    🕒 Son Eklenen Görevler
                  </h3>
                  <p style={{ color: '#888', fontSize: '13px' }}>
                    En son oluşturduğun 5 görev
                  </p>
                </div>

                {tasks.length === 0 ? (
                  <p style={{ color: '#888', fontSize: '14px' }}>
                    Henüz görev eklenmemiş.
                  </p>
                ) : (
                  [...tasks]
                    .sort((a, b) =>
                      new Date(b.created_at || 0) - new Date(a.created_at || 0)
                    )
                    .slice(0, 5)
                    .map((task) => (
                      <div
                        key={task.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '14px 0',
                          borderBottom: '1px solid #f0f0f5'
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          minWidth: 0
                        }}>
                          <span>{task.completed ? '✓' : '○'}</span>
                          <span style={{
                            fontSize: '14px',
                            color: '#333',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {task.title}
                          </span>
                        </div>

                        <span style={{
                          fontSize: '11px',
                          fontWeight: '600',
                          padding: '6px 10px',
                          borderRadius: '20px',
                          whiteSpace: 'nowrap',
                          background:
                            task.priority === 'high' ? '#fff0f0' :
                              task.priority === 'medium' ? '#fff7e8' : '#eaf8f1',
                          color:
                            task.priority === 'high' ? '#e45b5b' :
                              task.priority === 'medium' ? '#d99a32' : '#35a879'
                        }}>
                          {task.priority === 'high' ? 'Yüksek' :
                            task.priority === 'medium' ? 'Orta' : 'Düşük'}
                        </span>
                      </div>
                    ))
                )}
              </section>

              {/* ÖNCELİKLİ GÖREVLER */}
              <section style={{
                background: '#fff',
                borderRadius: '18px',
                padding: '24px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                minWidth: 0
              }}>
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '17px', marginBottom: '6px' }}>
                    ⚡ Öncelikli Görevler
                  </h3>
                  <p style={{ color: '#888', fontSize: '13px' }}>
                    Öncelik vermen gereken görevler
                  </p>
                </div>

                {tasks.filter((task) =>
                  task.priority === 'high' && !task.completed
                ).length === 0 ? (
                  <p style={{ color: '#888', fontSize: '14px' }}>
                    Şu anda bekleyen yüksek öncelikli görevin yok. 🎉
                  </p>
                ) : (
                  tasks
                    .filter((task) =>
                      task.priority === 'high' && !task.completed
                    )
                    .map((task) => (
                      <div
                        key={task.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '14px 0',
                          borderBottom: '1px solid #f0f0f5'
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <strong style={{ fontSize: '14px', color: '#333' }}>
                            {task.title}
                          </strong>

                          <p style={{
                            fontSize: '12px',
                            color: '#888',
                            marginTop: '5px'
                          }}>
                            {task.due_date
                              ? `Son teslim: ${task.due_date}`
                              : 'Son teslim tarihi belirtilmedi'}
                          </p>
                        </div>

                        <span style={{
                          background: '#fff0f0',
                          color: '#e45b5b',
                          padding: '6px 10px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: '600',
                          whiteSpace: 'nowrap'
                        }}>
                          Yüksek
                        </span>
                      </div>
                    ))
                )}
              </section>

            </div>

            {/* HAFTALIK HEDEF */}
            <section className="weekly-goal-card">
              <div className="weekly-goal-header">
                <div>
                  <h3>🎯 Haftalık Hedef</h3>
                  <p>
                    Bu hafta {weeklyCompletedTasks} / {weeklyTarget} görev tamamladın.
                  </p>
                </div>

                <div className="weekly-goal-controls">
                  <input
                    type="number"
                    min="1"
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    disabled={goalLoading}
                  />

                  <button
                    type="button"
                    onClick={saveGoal}
                    disabled={goalLoading}
                  >
                    Kaydet
                  </button>
                </div>
              </div>

              <div className="weekly-goal-progress">
                <div
                  className="weekly-goal-progress-fill"
                  style={{ width: `${weeklyGoalPercentage}%` }}
                />
              </div>

              <p className="weekly-goal-percentage">
                %{weeklyGoalPercentage} tamamlandı
                {weeklyCompletedTasks >= weeklyTarget &&
                  ' — Haftalık hedefe ulaştın! 🎉'}
              </p>
            </section>

            {/* GÖREV TAMAMLAMA AKTİVİTESİ */}
            <section style={{
              background: '#fff',
              borderRadius: '18px',
              padding: '24px',
              marginTop: '24px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
            }}>
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '17px', marginBottom: '6px' }}>
                  📊 Görev Tamamlama Aktivitesi
                </h3>

                <p style={{ color: '#888', fontSize: '13px' }}>
                  {activityPeriod === 'daily' && 'Bugün saatlere göre tamamlanan görevler'}
                  {activityPeriod === 'weekly' && 'Son 7 günde tamamlanan görevler'}
                  {activityPeriod === 'monthly' && 'Bu ay haftalara göre tamamlanan görevler'}
                  {activityPeriod === 'yearly' && 'Son 12 ayda tamamlanan görevler'}
                </p>

                {/* DÖNEM SEÇİM BUTONLARI */}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  marginTop: '16px',
                  flexWrap: 'wrap'
                }}>
                  {[
                    { label: 'Günlük', value: 'daily' },
                    { label: 'Haftalık', value: 'weekly' },
                    { label: 'Aylık', value: 'monthly' },
                    { label: 'Yıllık', value: 'yearly' }
                  ].map((item) => (
                    <button
                      key={item.value}
                      onClick={() => setActivityPeriod(item.value)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                        background: activityPeriod === item.value ? '#5265d5' : '#f0f2f8',
                        color: activityPeriod === item.value ? '#fff' : '#555',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* TARİH SEÇİMİ */}
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  marginTop: '14px',
                  marginBottom: '10px',
                  flexWrap: 'wrap'
                }}>

                  {(activityPeriod === 'daily' || activityPeriod === 'weekly') && (
                    <>
                      <select
                        value={Number(activityMonth.split('-')[1])}
                        onChange={(e) => setActivityMonth(
                          `${activityMonth.split('-')[0]}-${String(e.target.value).padStart(2, '0')}`
                        )}
                        style={{
                          padding: '9px 12px',
                          border: '1px solid #e0e3ed',
                          borderRadius: '8px',
                          color: '#444'
                        }}
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {new Date(2026, i, 1).toLocaleDateString('tr-TR', { month: 'long' })}
                          </option>
                        ))}
                      </select>

                      <select
                        value={activityMonth.split('-')[0]}
                        onChange={(e) => setActivityMonth(
                          `${e.target.value}-${activityMonth.split('-')[1]}`
                        )}
                        style={{
                          padding: '9px 12px',
                          border: '1px solid #e0e3ed',
                          borderRadius: '8px',
                          color: '#444'
                        }}
                      >
                        {Array.from({ length: 100 }, (_, i) => 2026 + i).map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </>
                  )}

                  {activityPeriod === 'monthly' && (
                    <select
                      value={activityYear}
                      onChange={(e) => setActivityYear(Number(e.target.value))}
                      style={{
                        padding: '9px 12px',
                        border: '1px solid #e0e3ed',
                        borderRadius: '8px',
                        color: '#444'
                      }}
                    >
                      {Array.from({ length: 100 }, (_, i) => 2026 + i).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* GRAFİK ÇUBUKLARI */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-around',
                  alignItems: 'flex-end',
                  gap: '12px',
                  height: '180px',
                  paddingTop: '15px'
                }}>
                  {activityData.map((item, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: '10px',
                      height: '100%',
                      flex: 1
                    }}>
                      <span style={{
                        fontSize: '12px',
                        color: '#666',
                        fontWeight: '600'
                      }}>
                        {item.count}
                      </span>

                      <div style={{
                        width: '100%',
                        maxWidth: '38px',
                        height: `${Math.max(
                          8,
                          (item.count / Math.max(...activityData.map(day => day.count), 1)) * 115
                        )}px`,
                        background: '#5265d5',
                        borderRadius: '8px 8px 3px 3px',
                        transition: 'height 0.3s ease'
                      }} />

                      <span style={{
                        fontSize: '11px',
                        color: '#888'
                      }}>
                        {item.day}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        {/* TÜM GÖREVLER SAYFASI */}
        {activePage === 'dashboard' && activeMenu === 'allTasks' && (
          <section>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '25px', marginBottom: '8px' }}>
                ☷ Tüm Görevler
              </h2>
              <p style={{ color: '#888', fontSize: '14px' }}>
                Görevlerini buradan yönetebilir, düzenleyebilir ve takip edebilirsin.
              </p>
            </div>

            <div className="dashboard-grid">
              <div className="dashboard-left">
                <div className="form-panel">
                  <TaskForm
                    onAddTask={addTask}
                    editingTask={editingTask}
                    onUpdateTask={updateTask}
                    onCancelEdit={() => setEditingTaskId(null)}
                  />
                </div>
              </div>

              <div className="dashboard-right">
                <input
                  type="text"
                  className="search-input"
                  placeholder="⌕ Görevlerde ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />

                <div className="task-filters">
                  <button
                    className={filter === 'all' ? 'active-filter' : ''}
                    onClick={() => setFilter('all')}
                  >
                    Tümü
                  </button>

                  <button
                    className={filter === 'active' ? 'active-filter' : ''}
                    onClick={() => setFilter('active')}
                  >
                    Devam Eden
                  </button>

                  <button
                    className={filter === 'completed' ? 'active-filter' : ''}
                    onClick={() => setFilter('completed')}
                  >
                    Tamamlanan
                  </button>

                  <select
                    className="priority-filter-select"
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                  >
                    <option value="all">Tüm Öncelikler</option>
                    <option value="high">Yüksek Öncelik</option>
                    <option value="medium">Orta Öncelik</option>
                    <option value="low">Düşük Öncelik</option>
                  </select>
                </div>

                <TaskList
                  tasks={filteredTasks}
                  filter={filter}
                  onDeleteTask={deleteTask}
                  onToggleTask={toggleTask}
                  onEditTask={editTask}
                />
              </div>
            </div>
          </section>

        )}
        {/* TAMAMLANANLAR SAYFASI */}
        {activePage === 'dashboard' && activeMenu === 'completed' && (
          <section>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '25px', marginBottom: '8px' }}>
                ✓ Tamamlanan Görevler
              </h2>
              <p style={{ color: '#888', fontSize: '14px' }}>
                Başarıyla tamamladığın görevleri burada görebilirsin.
              </p>
            </div>

            <TaskList
              tasks={filteredTasks}
              filter="completed"
              onDeleteTask={deleteTask}
              onToggleTask={toggleTask}
              onEditTask={editTask}
            />
          </section>
        )}
        {/* İSTATİSTİKLER SAYFASI */}
        {activePage === 'statistics' && (
          <section style={{ padding: '10px 0 30px' }}>

            <div style={{ marginBottom: '25px' }}>
              <h2 style={{ fontSize: '25px', marginBottom: '8px' }}>
                📊 İstatistikler
              </h2>
              <p style={{ color: '#888', fontSize: '14px' }}>
                Görevlerini ve ilerlemeni buradan takip edebilirsin.
              </p>
            </div>

            {/* GENEL İSTATİSTİKLER */}
            <div className="stats-grid">
              <div className="stat-card total-card">
                <div className="stat-icon">▦</div>
                <div>
                  <p>Toplam Görev</p>
                  <h2>{totalTasks}</h2>
                </div>
              </div>

              <div className="stat-card active-card">
                <div className="stat-icon">▶</div>
                <div>
                  <p>Devam Eden</p>
                  <h2>{activeTasks}</h2>
                </div>
              </div>

              <div className="stat-card completed-card">
                <div className="stat-icon">✓</div>
                <div>
                  <p>Tamamlanan</p>
                  <h2>{completedTasks}</h2>
                </div>
              </div>

              <div className="stat-card overdue-card">
                <div className="stat-icon">◷</div>
                <div>
                  <p>Geciken</p>
                  <h2>{overdueTasks}</h2>
                </div>
              </div>
            </div>

            {/* TAMAMLANMA ORANI */}
            <div style={{
              background: '#fff',
              borderRadius: '18px',
              padding: '24px',
              marginTop: '24px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
            }}>
              <h3 style={{ marginBottom: '8px', fontSize: '17px' }}>
                🎯 Genel Tamamlanma Oranı
              </h3>

              <p style={{ color: '#888', fontSize: '13px', marginBottom: '18px' }}>
                Tüm görevlerinin ne kadarını tamamladığını gösterir.
              </p>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '10px'
              }}>
                <span style={{ color: '#777', fontSize: '14px' }}>
                  İlerleme
                </span>
                <strong style={{ color: '#6c63ff', fontSize: '20px' }}>
                  %{completionRate}
                </strong>
              </div>

              <div style={{
                height: '13px',
                background: '#eeeefa',
                borderRadius: '20px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${completionRate}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #6c63ff, #9b8cff)',
                  borderRadius: '20px',
                  transition: 'width 0.4s ease'
                }} />
              </div>

              <p style={{ marginTop: '12px', color: '#888', fontSize: '13px' }}>
                {completedTasks} / {totalTasks} görev tamamlandı.
              </p>
            </div>


            {/* ZAMANINDA TAMAMLAMA ORANI */}
            <div style={{
              background: '#fff',
              borderRadius: '18px',
              padding: '24px',
              marginTop: '24px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
            }}>
              <h3 style={{ marginBottom: '8px', fontSize: '17px' }}>
                ⏱️ Zamanında Tamamlama Oranı
              </h3>

              <p style={{ color: '#888', fontSize: '13px', marginBottom: '18px' }}>
                Teslim tarihine kadar tamamladığın görevlerin oranı.
              </p>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px'
              }}>
                <span style={{ color: '#777', fontSize: '14px' }}>
                  Zamanında tamamlanan
                </span>

                <strong style={{ color: '#16a085', fontSize: '20px' }}>
                  %{Math.min(onTimePercentage, 100)}
                </strong>
              </div>

              <div style={{
                height: '13px',
                background: '#e8f5f1',
                borderRadius: '20px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${Math.min(onTimePercentage, 100)}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #16a085, #48c9a9)',
                  borderRadius: '20px',
                  transition: 'width 0.4s ease'
                }} />
              </div>

              <p style={{
                marginTop: '12px',
                color: '#888',
                fontSize: '13px'
              }}>
                {onTimeTasks} / {tasksWithDueDate.length} görev zamanında tamamlandı.
              </p>

              {tasksWithDueDate.length === 0 && (
                <p style={{
                  marginTop: '8px',
                  color: '#999',
                  fontSize: '12px'
                }}>
                  Henüz teslim tarihi olan tamamlanmış görevin bulunmuyor.
                </p>
              )}
            </div>


            {/* GRAFİKLER - YAN YANA */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))',
              gap: '24px',
              marginTop: '24px'
            }}>

              {/* GÖREV DURUMU DAĞILIMI */}
              <div style={{
                background: '#fff',
                borderRadius: '18px',
                padding: '26px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
              }}>
                <h3 style={{ fontSize: '17px', marginBottom: '8px' }}>
                  📌 Görev Durumu Dağılımı
                </h3>

                <p style={{ color: '#888', fontSize: '13px', marginBottom: '25px' }}>
                  Görevlerinin mevcut durumlarına göre dağılımı.
                </p>

                {(() => {
                  const statusItems = [
                    {
                      label: 'Devam Eden',
                      count: activeTasks - overdueTasks,
                      color: '#6c63ff'
                    },
                    {
                      label: 'Tamamlanan',
                      count: completedTasks,
                      color: '#35b88a'
                    },
                    {
                      label: 'Geciken',
                      count: overdueTasks,
                      color: '#f29b61'
                    }
                  ]

                  return (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '25px',
                      flexWrap: 'wrap'
                    }}>
                      <div style={{
                        width: '170px',
                        height: '170px',
                        flexShrink: 0,
                        borderRadius: '50%',
                        background: createDonutGradient(statusItems),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <div style={{
                          width: '112px',
                          height: '112px',
                          borderRadius: '50%',
                          background: '#fff',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <strong style={{ fontSize: '28px', color: '#333' }}>
                            {totalTasks}
                          </strong>
                          <span style={{ fontSize: '11px', color: '#888' }}>
                            Toplam Görev
                          </span>
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        minWidth: '145px'
                      }}>
                        {statusItems.map((item) => (
                          <div key={item.label} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '9px'
                          }}>
                            <div style={{
                              width: '11px',
                              height: '11px',
                              borderRadius: '4px',
                              background: item.color,
                              flexShrink: 0
                            }} />

                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '12px', color: '#666' }}>
                                {item.label}
                              </div>
                              <strong style={{ fontSize: '15px', color: '#333' }}>
                                {item.count} görev
                              </strong>
                            </div>

                            <span style={{ fontSize: '12px', color: '#888' }}>
                              %{getPercentage(item.count)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* ÖNCELİK DAĞILIMI */}
              <div style={{
                background: '#fff',
                borderRadius: '18px',
                padding: '26px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
              }}>
                <h3 style={{ fontSize: '17px', marginBottom: '8px' }}>
                  ⚡ Görev Öncelik Dağılımı
                </h3>

                <p style={{ color: '#888', fontSize: '13px', marginBottom: '25px' }}>
                  Görevlerinin öncelik seviyelerine göre dağılımı.
                </p>

                {(() => {
                  const priorityItems = [
                    {
                      label: 'Yüksek Öncelik',
                      count: highPriorityTasks,
                      color: '#ef6464'
                    },
                    {
                      label: 'Orta Öncelik',
                      count: mediumPriorityTasks,
                      color: '#f2ad4e'
                    },
                    {
                      label: 'Düşük Öncelik',
                      count: lowPriorityTasks,
                      color: '#43b990'
                    }
                  ]

                  return (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '25px',
                      flexWrap: 'wrap'
                    }}>
                      <div style={{
                        width: '170px',
                        height: '170px',
                        flexShrink: 0,
                        borderRadius: '50%',
                        background: createDonutGradient(priorityItems),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <div style={{
                          width: '112px',
                          height: '112px',
                          borderRadius: '50%',
                          background: '#fff',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <strong style={{ fontSize: '28px', color: '#333' }}>
                            {totalTasks}
                          </strong>
                          <span style={{ fontSize: '11px', color: '#888' }}>
                            Toplam Görev
                          </span>
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        minWidth: '145px'
                      }}>
                        {priorityItems.map((item) => (
                          <div key={item.label} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '9px'
                          }}>
                            <div style={{
                              width: '11px',
                              height: '11px',
                              borderRadius: '4px',
                              background: item.color,
                              flexShrink: 0
                            }} />

                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '12px', color: '#666' }}>
                                {item.label}
                              </div>
                              <strong style={{ fontSize: '15px', color: '#333' }}>
                                {item.count} görev
                              </strong>
                            </div>

                            <span style={{ fontSize: '12px', color: '#888' }}>
                              %{getPercentage(item.count)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </div>

            </div>

            {/* BOŞ DURUM */}
            {totalTasks === 0 && (
              <div style={{
                background: '#fff',
                borderRadius: '16px',
                padding: '35px 24px',
                marginTop: '24px',
                textAlign: 'center',
                color: '#888'
              }}>
                <div style={{ fontSize: '35px', marginBottom: '12px' }}>
                  📋
                </div>
                <h3 style={{ color: '#444', marginBottom: '8px' }}>
                  Henüz istatistik oluşturulmadı
                </h3>
                <p style={{ fontSize: '14px' }}>
                  Görev ekledikçe istatistiklerin burada görüntülenecek.
                </p>
              </div>
            )}

          </section>
        )}

      </main>
    </div>
  )
}

export default App
