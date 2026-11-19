
import { useState, useEffect } from 'react'

function TaskForm({ onAddTask, editingTask, onUpdateTask, onCancelEdit }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('low')
  const [dueDate, setDueDate] = useState('')

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setPriority('low')
    setDueDate('')
  }

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title)
      setDescription(editingTask.description)
      setPriority(editingTask.priority)
      setDueDate(editingTask.dueDate || '')
    }
  }, [editingTask])

  const handleSubmit = (e) => {
    e.preventDefault()

    if (title.trim() === '') {
      alert('Lütfen görev başlığı girin!')
      return
    }

    if (editingTask) {
      onUpdateTask({
        ...editingTask,
        title,
        description,
        priority,
        dueDate
      })
    } else {
      onAddTask({
        id: Date.now(),
        title,
        description,
        priority,
        dueDate,
        completed: false
      })
    }

    resetForm()
  }

  const handleCancel = () => {
    resetForm()
    onCancelEdit()
  }

  return (
    <section className="task-form-section">
      <div className="form-heading">
        <div>
          <h2>{editingTask ? 'Görevi Düzenle' : 'Yeni Görev Oluştur'}</h2>
          <p>Planlarını oluştur, hedeflerine bir adım daha yaklaş.</p>
        </div>
        <span className="form-heading-icon">✎</span>
      </div>

      <form onSubmit={handleSubmit} className="task-form">
        <div className="form-group">
          <label htmlFor="task-title">Görev Başlığı</label>
          <input
            type="text"
            id="task-title"
            placeholder="Örn. Proje sunumunu hazırla"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="task-description">Açıklama</label>
          <textarea
            id="task-description"
            placeholder="Görev hakkında birkaç detay yaz..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="task-priority">Öncelik Seviyesi</label>
          <select
            id="task-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="low">Düşük Öncelik</option>
            <option value="medium">Orta Öncelik</option>
            <option value="high">Yüksek Öncelik</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="task-due-date">Son Tarih</label>
          <input
            type="date"
            id="task-due-date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <button type="submit" className="submit-button">
          {editingTask ? '✓ Değişiklikleri Kaydet' : '+ Görev Oluştur'}
        </button>

        {editingTask && (
          <button
            type="button"
            className="cancel-button"
            onClick={handleCancel}
          >
            İptal
          </button>
        )}
      </form>
    </section>
  )
}

export default TaskForm
