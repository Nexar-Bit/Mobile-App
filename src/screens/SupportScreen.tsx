import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../services/api';

interface SupportTicket {
  id: number;
  subject: string;
  message: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at?: string;
}

interface HelpArticle {
  id: number;
  title: string;
  content: string;
  category: string;
  created_at: string;
}

const SupportScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState<'tickets' | 'help' | 'new'>('tickets');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [newTicket, setNewTicket] = useState({ subject: '', message: '', priority: 'medium' });
  const [creating, setCreating] = useState(false);

  const loadTickets = async () => {
    try {
      const data = await apiService.getSupportTickets();
      setTickets(data);
    } catch (error) {
      console.error('Failed to load tickets:', error);
    }
  };

  const loadArticles = async (category?: string) => {
    try {
      const data = await apiService.getHelpArticles(category);
      setArticles(data);
    } catch (error) {
      console.error('Failed to load articles:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await apiService.getHelpArticleCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadData = async () => {
    try {
      if (view === 'tickets') {
        await loadTickets();
      } else if (view === 'help') {
        await Promise.all([loadArticles(selectedCategory || undefined), loadCategories()]);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [view, selectedCategory]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleCreateTicket = async () => {
    if (!newTicket.subject.trim() || !newTicket.message.trim()) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    try {
      setCreating(true);
      await apiService.createSupportTicket({
        subject: newTicket.subject,
        message: newTicket.message,
        priority: newTicket.priority,
      });
      Alert.alert('Sucesso', 'Ticket criado com sucesso');
      setNewTicket({ subject: '', message: '', priority: 'medium' });
      setView('tickets');
      loadTickets();
    } catch (error: any) {
      Alert.alert('Erro', error?.response?.data?.detail || 'Falha ao criar ticket');
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#007AFF';
      case 'in_progress': return '#FF9500';
      case 'resolved': return '#34C759';
      case 'closed': return '#8E8E93';
      default: return '#8E8E93';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'open': 'Aberto',
      'in_progress': 'Em Andamento',
      'resolved': 'Resolvido',
      'closed': 'Fechado',
    };
    return statusMap[status] || status;
  };

  if (loading && view !== 'new') {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, view === 'tickets' && styles.tabActive]}
          onPress={() => setView('tickets')}
        >
          <Text style={[styles.tabText, view === 'tickets' && styles.tabTextActive]}>
            Tickets
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, view === 'help' && styles.tabActive]}
          onPress={() => setView('help')}
        >
          <Text style={[styles.tabText, view === 'help' && styles.tabTextActive]}>
            Ajuda
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, view === 'new' && styles.tabActive]}
          onPress={() => setView('new')}
        >
          <Text style={[styles.tabText, view === 'new' && styles.tabTextActive]}>
            Novo Ticket
          </Text>
        </TouchableOpacity>
      </View>

      {view === 'new' ? (
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionTitle}>Criar Novo Ticket</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Assunto *</Text>
            <TextInput
              style={styles.input}
              value={newTicket.subject}
              onChangeText={(text) => setNewTicket({ ...newTicket, subject: text })}
              placeholder="Digite o assunto do ticket"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mensagem *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={newTicket.message}
              onChangeText={(text) => setNewTicket({ ...newTicket, message: text })}
              placeholder="Descreva seu problema ou dúvida"
              multiline
              numberOfLines={6}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Prioridade</Text>
            <View style={styles.priorityButtons}>
              {['low', 'medium', 'high', 'urgent'].map((priority) => (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.priorityButton,
                    newTicket.priority === priority && styles.priorityButtonActive,
                  ]}
                  onPress={() => setNewTicket({ ...newTicket, priority })}
                >
                  <Text
                    style={[
                      styles.priorityButtonText,
                      newTicket.priority === priority && styles.priorityButtonTextActive,
                    ]}
                  >
                    {priority === 'low' ? 'Baixa' :
                     priority === 'medium' ? 'Média' :
                     priority === 'high' ? 'Alta' : 'Urgente'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, creating && styles.submitButtonDisabled]}
            onPress={handleCreateTicket}
            disabled={creating}
          >
            {creating ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="send" size={20} color="white" />
                <Text style={styles.submitButtonText}>Enviar Ticket</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      ) : view === 'help' ? (
        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Category Filter */}
          {categories.length > 0 && (
            <View style={styles.categoryFilter}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  style={[
                    styles.categoryChip,
                    !selectedCategory && styles.categoryChipActive,
                  ]}
                  onPress={() => setSelectedCategory('')}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      !selectedCategory && styles.categoryChipTextActive,
                    ]}
                  >
                    Todas
                  </Text>
                </TouchableOpacity>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryChip,
                      selectedCategory === category && styles.categoryChipActive,
                    ]}
                    onPress={() => setSelectedCategory(category)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        selectedCategory === category && styles.categoryChipTextActive,
                      ]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Articles */}
          <View style={styles.section}>
            {articles.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="help-circle-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>Nenhum artigo encontrado</Text>
              </View>
            ) : (
              articles.map((article) => (
                <TouchableOpacity key={article.id} style={styles.articleCard}>
                  <View style={styles.articleHeader}>
                    <Ionicons name="document-text" size={24} color="#007AFF" />
                    <View style={styles.articleContent}>
                      <Text style={styles.articleTitle}>{article.title}</Text>
                      {article.category && (
                        <Text style={styles.articleCategory}>{article.category}</Text>
                      )}
                    </View>
                  </View>
                  <Text style={styles.articlePreview} numberOfLines={2}>
                    {article.content}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.ticketCard}>
              <View style={styles.ticketHeader}>
                <Text style={styles.ticketSubject}>{item.subject}</Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(item.status) + '20' }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: getStatusColor(item.status) }
                  ]}>
                    {getStatusText(item.status)}
                  </Text>
                </View>
              </View>
              <Text style={styles.ticketMessage} numberOfLines={2}>
                {item.message}
              </Text>
              <View style={styles.ticketFooter}>
                <Text style={styles.ticketDate}>
                  {formatDate(item.created_at)}
                </Text>
                {item.priority && (
                  <Text style={styles.ticketPriority}>
                    Prioridade: {item.priority}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="ticket-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>Nenhum ticket encontrado</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  priorityButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  priorityButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
  },
  priorityButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF10',
  },
  priorityButtonText: {
    fontSize: 14,
    color: '#666',
  },
  priorityButtonTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  categoryFilter: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#007AFF',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#666',
  },
  categoryChipTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  section: {
    padding: 16,
  },
  articleCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  articleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  articleContent: {
    flex: 1,
    marginLeft: 12,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  articleCategory: {
    fontSize: 12,
    color: '#999',
  },
  articlePreview: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  ticketCard: {
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  ticketSubject: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ticketMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketDate: {
    fontSize: 12,
    color: '#999',
  },
  ticketPriority: {
    fontSize: 12,
    color: '#999',
    textTransform: 'capitalize',
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
});

export default SupportScreen;

