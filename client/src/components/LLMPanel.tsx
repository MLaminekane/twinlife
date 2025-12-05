import { useState } from 'react'
import { useStore } from '../state/store'
import { sendLLM } from '../lib/api'

export function LLMPanel() {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const applyDirective = useStore(s => s.applyDirective)
  const people = useStore(s => s.people)
  
  // Personnes avec rôles
  const customPeople = people.filter(p => p.role || p.workplace || p.department)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return
    
    setLoading(true)
    setError('')
    
    try {
      console.log('[LLMPanel] Envoi requête:', prompt)
      const directive = await sendLLM(prompt)
      console.log('[LLMPanel] Directive reçue:', directive)
      applyDirective(directive)
      console.log('[LLMPanel] Directive appliquée')
      setPrompt('')
    } catch (err: any) {
      console.error('[LLMPanel] Erreur:', err)
      setError(err.message || 'Erreur LLM')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="panel" style={{ width: 400, maxHeight: '80vh', overflow: 'auto', top: 70 }}>
      <h3>🤖 Assistant LLM</h3>
      <div className="small" style={{ marginBottom: 12 }}>
        Commandes persistantes : ajouter/supprimer personnes & bâtiments
      </div>

      <form onSubmit={handleSubmit}>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Ex: ajoute Lamine comme employé à la banque"
          style={{ minHeight: 80, marginBottom: 8 }}
          disabled={loading}
        />
        <button type="submit" className="btn" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Traitement...' : 'Envoyer'}
        </button>
      </form>

      {error && (
        <div style={{ color: '#ef4444', marginTop: 8, fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      {customPeople.length > 0 && (
        <>
          <div className="separator" />
          <h4 style={{ fontSize: 14, margin: '8px 0' }}>
            👥 Personnes personnalisées ({customPeople.length})
          </h4>
          <div style={{ maxHeight: 200, overflow: 'auto', fontSize: 12 }}>
            {customPeople.map(p => (
              <div 
                key={p.id} 
                style={{ 
                  padding: '4px 8px', 
                  marginBottom: 4, 
                  background: 'rgba(59, 130, 246, 0.1)', 
                  borderRadius: 6,
                  border: '1px solid rgba(59, 130, 246, 0.2)'
                }}
              >
                <div style={{ fontWeight: 600 }}>{p.name}</div>
                {p.role && <div style={{ color: '#94a3af', fontSize: 11 }}>
                  {p.role === 'student' ? '🎓 Étudiant' : 
                   p.role === 'employee' ? '💼 Employé' :
                   p.role === 'professor' ? '👨‍🏫 Professeur' :
                   p.role === 'worker' ? '👷 Travailleur' : '👤 Visiteur'}
                </div>}
                {p.workplace && <div style={{ color: '#94a3af', fontSize: 11 }}>
                  🏢 Lieu: {useStore.getState().buildings.find(b => b.id === p.workplace)?.name || p.workplace}
                </div>}
                {p.department && <div style={{ color: '#94a3af', fontSize: 11 }}>
                  🏛️ Département: {p.department}
                </div>}
              </div>
            ))}
          </div>
        </>
      )}

      <div className="separator" />
      <div className="small">
        <strong>Exemples de commandes :</strong><br/>
        • "ajoute Lamine comme employé à la banque"<br/>
        • "crée un nouveau café dans la zone commerciale"<br/>
        • "ajoute 5 étudiants à l'université"<br/>
        • "supprime le bâtiment X"<br/>
        • "supprime la personne Lamine"<br/>
        <br/>
        💾 Toutes les modifications sont sauvegardées automatiquement
      </div>
    </div>
  )
}
