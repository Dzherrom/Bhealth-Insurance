'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  X, 
  Send, 
  MessageSquare, 
  User, 
  Clock,
  Paperclip,
  Trash2,
  Image as ImageIcon,
  AtSign,
  Edit2
} from 'lucide-react';
import { notasApi, resolveApiMediaUrl, usersApi } from '@/lib/api';
import { mapNotaUsuario } from '@/components/polizas/notaUtils';
import { useToast } from '@/hooks/use-toast';
import { AnimatePresence, motion } from 'motion/react';
import { useSidebar } from '@/components/sidebar';

const OVERLAY_TRANSITION = { duration: 0.28, ease: [0.4, 0, 0.2, 1] as const };
const PANEL_TRANSITION = { duration: 0.38, ease: [0.32, 0.72, 0, 1] as const };

const CRM_SIDEBAR_EXPANDED_PX = 200;
const CRM_SIDEBAR_COLLAPSED_PX = 56;

function useNotesPanelLeftOffset() {
  const { state } = useSidebar();
  return state === 'collapsed' ? CRM_SIDEBAR_COLLAPSED_PX : CRM_SIDEBAR_EXPANDED_PX;
}

interface NotaChat {
  id: number;
  mensaje: string;
  archivo?: string;
  adjuntos?: Array<{
    id: number;
    archivo: string;
    nombre?: string;
  }>;
  usuario: {
    nombre: string;
    apellido: string;
    iniciales: string;
    avatar?: string;
    rol?: string;
  };
  fechaCreacion: string;
  estado?: string;
}

interface NotasChatProps {
  isOpen: boolean;
  onClose: () => void;
  onClosed?: () => void;
  polizaInfo: {
    cliente: string;
    plan: string;
    id: string;
    estado?: string;
    etiquetas?: { id: number; nombre: string; color?: string }[];
  };
}

const estadoColors = {
  'EN PROCESO': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  'BILLS': 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
  'BILLS RESULT': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  'CAMBIO DE VIDA': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  'CAMBIO DE VIDA-TRES MES': 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
  'CAMBIO NO REALIZADO': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  'CAMBIO REALIZADO SLEEP': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  'COMPLETO': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
};

export function NotasChat({ isOpen, onClose, onClosed, polizaInfo }: NotasChatProps) {
  const panelLeftOffset = useNotesPanelLeftOffset();
  const [notas, setNotas] = useState<NotaChat[]>([]);
  const [nuevaNota, setNuevaNota] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [archivosAdjuntos, setArchivosAdjuntos] = useState<File[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { toast } = useToast();
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (notas.length > 0) {
      scrollToBottom();
    }
  }, [notas]);

  useEffect(() => {
    if (!isOpen || !polizaInfo?.id) return;
    loadNotas();
    loadUsuarios();
  }, [isOpen, polizaInfo?.id]);

  const loadUsuarios = async () => {
    try {
      const data = await usersApi.list();
      let arr = data as any;
      if (arr.results) arr = arr.results;
      setUsuarios(arr);
    } catch (e) {
      console.error('Error cargando usuarios para menciones:', e);
    }
  };

  const loadNotas = async () => {
    setIsLoading(true);
    try {
      const dePoliza = await notasApi.listByPoliza(polizaInfo.id);
      setNotas(dePoliza.map((n: any) => ({
        id: n.id,
        mensaje: n.contenido,
        archivo: resolveApiMediaUrl(n.archivo),
        adjuntos: (n.adjuntos ?? []).map((adjunto: any) => ({
          ...adjunto,
          archivo: resolveApiMediaUrl(adjunto.archivo),
        })),
        usuario: mapNotaUsuario(n),
        fechaCreacion: n.fecha_creacion ?? new Date().toISOString(),
        estado: n.estado // if any
      })));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const formatTime = (dateString: string) => {
    const fecha = new Date(dateString);
    const ahora = new Date();
    const diferencia = ahora.getTime() - fecha.getTime();
    const minutos = Math.floor(diferencia / (1000 * 60));
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    
    if (minutos < 60) {
      return `Hace ${minutos} min`;
    } else if (horas < 24) {
      return `Hace ${horas}h`;
    } else if (dias === 1) {
      return 'Ayer';
    } else if (dias < 7) {
      return `Hace ${dias} días`;
    } else {
      return fecha.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const handleDeleteNota = async (id: number) => {
    if(!window.confirm('¿Seguro de borrar esta nota?')) return;
    try {
      await notasApi.delete(id);
      toast({ title: 'Nota eliminada' });
      loadNotas();
    } catch (err) {
      console.error(err);
      toast({ title: 'Error al eliminar', variant: 'destructive' });
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNuevaNota(val);

    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      setShowMentions(true);
      setMentionFilter(mentionMatch[1].toLowerCase());
      setMentionIndex(0);
    } else {
      setShowMentions(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      const filesArray = Array.from(e.clipboardData.files);
      setArchivosAdjuntos((prev) => [...prev, ...filesArray]);
      e.preventDefault();
    }
  };

  const filteredUsuarios = usuarios.filter(u => {
    const isCliente = u.profile?.role?.toLowerCase() === 'cliente' || u.role?.toLowerCase() === 'cliente' || u.groups?.some((g: any) => g.name?.toLowerCase() === 'cliente');
    if (isCliente) return false;
    
    return u.username?.toLowerCase().includes(mentionFilter) || 
           u.first_name?.toLowerCase().includes(mentionFilter) ||
           u.last_name?.toLowerCase().includes(mentionFilter);
  });

  const insertMention = (username: string) => {
    const textarea = document.getElementById('nota-textarea') as HTMLTextAreaElement;
    const cursorPosition = textarea?.selectionStart || nuevaNota.length;
    const textBeforeCursor = nuevaNota.slice(0, cursorPosition);
    const textAfterCursor = nuevaNota.slice(cursorPosition);
    const textBeforeMention = textBeforeCursor.replace(/@\w*$/, '');
    
    setNuevaNota(textBeforeMention + `@${username} ` + textAfterCursor);
    setShowMentions(false);
    
    setTimeout(() => {
      if (textarea) {
        textarea.focus();
      }
    }, 0);
  };

  const handleEnviarNota = async () => {
    if (!nuevaNota.trim() && archivosAdjuntos.length === 0) return;
    try {
      const formData = new FormData();
      formData.append('titulo', nuevaNota.trim().slice(0, 50) || 'Nota adjunta');
      formData.append('contenido', nuevaNota.trim() || 'Archivo adjunto');
      formData.append('poliza', String(polizaInfo.id));
      for (const archivo of archivosAdjuntos) {
        formData.append('archivos', archivo);
      }

      await (notasApi as any).createFormData(formData);

      toast({ title: 'Nota agregada' });
      setNuevaNota('');
      setShowMentions(false);
      setArchivosAdjuntos([]);
      loadNotas();
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Error al agregar nota', description: err.message || 'Error desconocido', variant: 'destructive' });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex(prev => Math.min(prev + 1, filteredUsuarios.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(prev => Math.max(prev - 1, 0));
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (filteredUsuarios.length > 0) {
          insertMention(filteredUsuarios[mentionIndex].username);
        } else {
          setShowMentions(false);
        }
        return;
      }
      if (e.key === 'Escape') {
        setShowMentions(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviarNota();
    }
  };
  return (
    <AnimatePresence onExitComplete={onClosed}>
      {isOpen && (
        <>
          <motion.div
            key="notas-chat-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={OVERLAY_TRANSITION}
            className="fixed top-0 right-0 bottom-0 z-40 bg-black/25"
            style={{ left: panelLeftOffset }}
            onClick={handleClose}
            aria-hidden="true"
          />

          <motion.div
            key="notas-chat-panel"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={PANEL_TRANSITION}
            className="fixed top-0 z-50 flex h-full flex-col border-r border-slate-200 bg-white will-change-transform dark:border-slate-800 dark:bg-slate-900"
            style={{
              left: panelLeftOffset,
              width: `min(500px, calc(100vw - ${panelLeftOffset}px))`,
              transform: 'translateZ(0)',
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Notas de póliza"
          >
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Notas de Póliza</h2>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            </Button>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-primary/20 dark:text-primary text-xs">
                  {polizaInfo.cliente.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm text-slate-900 dark:text-white">{polizaInfo.cliente}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{polizaInfo.plan}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-1 mt-3">
              {polizaInfo.estado && (
                <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                  {polizaInfo.estado}
                </Badge>
              )}
              {polizaInfo.etiquetas && polizaInfo.etiquetas.map((etq) => (
                <Badge 
                  key={etq.id}
                  variant="secondary" 
                  className="text-xs"
                  style={{ backgroundColor: etq.color || '#e2e8f0', color: '#1e293b' }}
                >
                  {etq.nombre}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">Cargando notas...</div>
            ) : notas.map((nota) => (
              <div key={nota.id} className="flex space-x-3 group relative">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  {nota.usuario.avatar ? (
                    <AvatarImage src={nota.usuario.avatar} alt={nota.usuario.nombre} />
                  ) : (
                    <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-primary/20 dark:text-primary text-xs">
                      {nota.usuario.iniciales}
                    </AvatarFallback>
                  )}
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-sm text-slate-900 dark:text-white">
                      {nota.usuario.nombre} {nota.usuario.apellido}
                    </span>
                    <Badge variant="outline" className="text-[10px] dark:border-slate-700 dark:text-slate-300">
                      {nota.usuario.rol}
                    </Badge>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                      {formatTime(nota.fechaCreacion)}
                    </span>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-3">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {nota.mensaje.split(/(@\w+)/g).map((part: string, i: number) => 
                        part.startsWith('@') ? <span key={i} className="text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/30 px-1 rounded-sm">{part}</span> : part
                      )}
                    </p>
                    
                    {(nota.archivo || nota.adjuntos?.length) && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {nota.archivo && (
                          nota.archivo.match(/\.(jpeg|jpg|gif|png|webp|svg)/i) ? (
                            <button onClick={() => setPreviewImage(nota.archivo!)} className="block w-24 h-24 rounded-md overflow-hidden border dark:border-slate-700 hover:opacity-90 transition-opacity">
                              <img src={nota.archivo} alt="Adjunto" className="w-full h-full object-cover" />
                            </button>
                          ) : (
                            <a href={nota.archivo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 p-1.5 rounded transition-colors">
                              <Paperclip className="h-3 w-3 mr-1" />
                              Archivo
                            </a>
                          )
                        )}
                        {nota.adjuntos?.map((adjunto) => (
                          adjunto.archivo.match(/\.(jpeg|jpg|gif|png|webp|svg)/i) ? (
                            <button key={adjunto.id} onClick={() => setPreviewImage(adjunto.archivo)} className="block w-24 h-24 rounded-md overflow-hidden border dark:border-slate-700 hover:opacity-90 transition-opacity">
                              <img src={adjunto.archivo} alt="Adjunto" className="w-full h-full object-cover" />
                            </button>
                          ) : (
                            <a key={adjunto.id} href={adjunto.archivo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 p-1.5 rounded transition-colors">
                              <Paperclip className="h-3 w-3 mr-1" />
                              {adjunto.nombre || 'Adjunto'}
                            </a>
                          )
                        ))}
                      </div>
                    )}
                    
                    {nota.estado && (
                      <Badge 
                        variant="secondary" 
                        className={`text-xs mt-2 ${estadoColors[nota.estado as keyof typeof estadoColors]}`}
                      >
                        {nota.estado}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:bg-slate-800" onClick={() => handleDeleteNota(nota.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
            
            {notas.length === 0 && !isLoading && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay notas aún</p>
                <p className="text-xs mt-1">Inicia la conversación escribiendo una nota</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 relative">
          
          {showMentions && filteredUsuarios.length > 0 && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg overflow-y-auto z-50 max-h-48 custom-scrollbar">
              {filteredUsuarios.map((u, i) => (
                <div 
                  key={u.id}
                  className={`px-3 py-2 cursor-pointer flex items-center gap-2 ${
                    i === mentionIndex 
                      ? 'bg-slate-100 dark:bg-slate-700' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                  onClick={() => insertMention(u.username)}
                >
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={resolveApiMediaUrl(u.profile?.avatar)} />
                    <AvatarFallback className="bg-primary/20 text-primary text-[10px]">
                      {u.first_name?.[0] || u.username?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-900 dark:text-white leading-none">
                      {u.first_name} {u.last_name}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">@{u.username}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3">
            <Textarea
              id="nota-textarea"
              placeholder="Escribir una nota... Usa @ para mencionar o pega una imagen"
              value={nuevaNota}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              className="min-h-[80px] resize-none bg-white dark:bg-slate-800 dark:text-white"
              rows={3}
            />
            
            {archivosAdjuntos.length > 0 && (
              <div className="space-y-2">
                {archivosAdjuntos.map((archivo, index) => (
                  <div key={`${archivo.name}-${index}`} className="flex items-center gap-2 text-xs text-muted-foreground dark:text-gray-400 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-md truncate max-w-full">
                    <Paperclip className="h-3 w-3 shrink-0" />
                    <span className="truncate">{archivo.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 ml-auto shrink-0"
                      onClick={() => setArchivosAdjuntos((prev) => prev.filter((_, fileIndex) => fileIndex !== index))}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex space-x-1">
                <input 
                  id="chat-file-upload" 
                  type="file" 
                  multiple
                  className="hidden" 
                  onChange={(e) => setArchivosAdjuntos((prev) => [...prev, ...Array.from(e.target.files ?? [])])} 
                />
                <Button variant="outline" size="icon" className="h-8 w-8 dark:border-slate-700" onClick={() => document.getElementById('chat-file-upload')?.click()}>
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8 dark:border-slate-700" onClick={() => {
                  const input = document.getElementById('chat-file-upload');
                  if (input) {
                    input.setAttribute('accept', 'image/*');
                    input.click();
                    input.removeAttribute('accept');
                  }
                }}>
                  <ImageIcon className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8 dark:border-slate-700" onClick={() => setNuevaNota(prev => prev + '@')}>
                  <AtSign className="h-4 w-4" />
                </Button>
              </div>
              
              <Button 
                onClick={handleEnviarNota}
                disabled={!nuevaNota.trim() && archivosAdjuntos.length === 0}
                size="sm"
              >
                <Send className="w-4 h-4 mr-2" />
                Enviar
              </Button>
            </div>
          </div>
        </div>
          </motion.div>

          {previewImage && (
            <div 
              className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 cursor-pointer"
              onClick={() => setPreviewImage(null)}
            >
              <img src={previewImage} alt="Vista previa" className="max-w-full max-h-full object-contain" />
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-4 right-4 text-white hover:bg-white/20"
                onClick={(e) => { e.stopPropagation(); setPreviewImage(null); }}
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}