
import { useState } from 'react'

function TaskList({ tasks, filter, onDeleteTask, onToggleTask, onEditTask }) {
  const [deleteTaskId, setDeleteTaskId] = useState(null)
  const [sortOption, setSortOption] = useState('newest')

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const priorityLabels = {
    low: 'Düşük',
    medium: 'Orta',
    high: 'Yüksek'
  }

  const priorityValues = {
    high: 3,
    medium: 2,
    low: 1
  }

  const selectedTask = tasks.find(
    (task) => task.id === deleteTaskId
  )

  // Görevleri seçilen kritere göre sırala
  const sortedTasks = [...tasks].sort((a, b) => {
    if (sortOption === 'newest') {
      return new Date(b.created_at) - new Date(a.created_at)
    }

    if (sortOption === 'oldest') {
      return new Date(a.created_at) - new Date(b.created_at)
    }

    if (sortOption === 'priority') {
      return (
        (priorityValues[b.priority] || 0) -
        (priorityValues[a.priority] || 0)
      )
    }

    if (sortOption === 'dueDate') {
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1

      return new Date(a.dueDate) - new Date(b.dueDate)
    }

    return 0
  })

  const confirmDelete = () => {
    if (deleteTaskId === null) return

    onDeleteTask(deleteTaskId)
    setDeleteTaskId(null)
  }

  return (
    <section className="task-list-section">
      <div className="task-list-heading">
        <div>
          <h2>Görevlerim</h2>
          <p>Yapılacaklarını planla ve ilerlemeni takip et.</p>
        </div>

        <div className="task-count">
          <strong>{tasks.length}</strong>
          <span>Görev</span>
        </div>
      </div>

      {/* GÖREV SIRALAMA */}
      <div className="task-sort-container">
        <label htmlFor="task-sort">Sırala:</label>

        <select
          id="task-sort"
          className="task-sort-select"
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
        >
          <option value="newest">En yeni</option>
          <option value="oldest">En eski</option>
          <option value="priority">Önceliğe göre</option>
          <option value="dueDate">Son teslim tarihine göre</option>
        </select>
      </div>

      <div className="task-list-container">
        {tasks.length === 0 ? (
          <div className="empty-message">
            <span className="empty-icon">✓</span>

            <h3>
              {filter === 'all'
                ? 'Henüz hiç görevin yok'
                : filter === 'active'
                  ? 'Devam eden görevin yok'
                  : 'Henüz tamamlanan görevin yok'}
            </h3>

            <p>
              {filter === 'all'
                ? 'İlk görevini ekleyerek planlamaya başlayabilirsin.'
                : filter === 'active'
                  ? 'Şu anda devam eden bir görevin bulunmuyor.'
                  : 'Görevlerini tamamladıkça başarıların burada görünecek.'}
            </p>
          </div>
        ) : (
          sortedTasks.map((task) => {
            const isOverdue =
              task.dueDate &&
              new Date(task.dueDate + 'T00:00:00') < today &&
              !task.completed

            return (
              <article
                key={task.id}
                className={`task-card task-priority-${task.priority} ${
                  task.completed ? 'completed-task' : ''
                }`}
              >
                <div className="task-card-top">
                  <div className="task-title-area">
                    <h3>{task.title}</h3>
                    <span className={`priority ${task.priority}`}>
                      {priorityLabels[task.priority] || task.priority} Öncelik
                    </span>
                  </div>

                  {task.completed ? (
                    <span className="completed-label">✓ Tamamlandı</span>
                  ) : (
                    <span className="task-status">Devam ediyor</span>
                  )}
                </div>

                {task.description && (
                  <p className="task-description">{task.description}</p>
                )}

                <div className="task-card-footer">
                  <div className="task-details">
                    {task.dueDate && (
                      <span className="task-date">
                        <span>▦</span>
                        {new Date(
                          task.dueDate + 'T00:00:00'
                        ).toLocaleDateString('tr-TR')}
                      </span>
                    )}

                    {isOverdue && (
                      <span className="overdue-warning">
                        ⚠ Süresi geçti
                      </span>
                    )}
                  </div>

                  <div className="task-actions">
                    <button
                      className="complete-button"
                      onClick={() => onToggleTask(task.id)}
                    >
                      {task.completed ? '↩ Geri al' : '✓ Tamamla'}
                    </button>

                    <button
                      className="edit-button"
                      onClick={() => onEditTask(task.id)}
                    >
                      Düzenle
                    </button>

                    <button
                      className="delete-button"
                      onClick={() => setDeleteTaskId(task.id)}
                    >
                      Sil
                    </button>
                  </div>
                </div>
              </article>
            )
          })
        )}
      </div>

      {/* SİLME ONAY PENCERESİ */}
      {selectedTask && (
        <div
          className="delete-modal-overlay"
          onClick={() => setDeleteTaskId(null)}
        >
          <div
            className="delete-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="delete-modal-icon">!</div>

            <h3>Görevi silmek istediğine emin misin?</h3>

            <p>
              <strong>{selectedTask.title}</strong> görevi kalıcı olarak
              silinecek. Bu işlem geri alınamaz.
            </p>

            <div className="delete-modal-actions">
              <button
                type="button"
                className="delete-cancel-button"
                onClick={() => setDeleteTaskId(null)}
              >
                Vazgeç
              </button>

              <button
                type="button"
                className="delete-confirm-button"
                onClick={confirmDelete}
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default TaskList
