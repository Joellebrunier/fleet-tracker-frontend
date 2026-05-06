'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  MapPin,
  Calendar,
  Truck,
  User,
  MessageCircle,
  CheckCircle2,
  XCircle,
  Flag,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

type AnomalyType = 'surconsommation' | 'vol_carburant' | 'plein_suspect' | 'écart_kilométrique';
type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';
type AnomalyStatus = 'detected' | 'investigating' | 'confirmed' | 'false_positive' | 'resolved';

interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  type: 'fill' | 'consumption' | 'gps' | 'alert';
}

interface RelatedTransaction {
  id: string;
  date: string;
  type: 'ravitaillement' | 'vidange' | 'carburant';
  amount: number;
  volume?: number;
  location: string;
}

interface Comment {
  id: string;
  author: string;
  timestamp: string;
  text: string;
}

export default function FuelAnomalyDetailPage() {
  const [anomalyStatus, setAnomalyStatus] = useState<AnomalyStatus>('detected');
  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      author: 'Jean Dupont',
      timestamp: '2026-05-05 14:30',
      text: 'Anomalie probable détectée lors de la révision. À investiguer.',
    },
    {
      id: '2',
      author: 'Marie Martin',
      timestamp: '2026-05-04 10:15',
      text: 'Consommation inhabituelle confirmée. Augmentation de 15% par rapport à la moyenne.',
    },
  ]);
  const [newComment, setNewComment] = useState('');

  // Mock anomaly data
  const anomaly = {
    id: 'ANOM-2026-0547',
    type: 'surconsommation' as AnomalyType,
    severity: 'high' as SeverityLevel,
    date: '2026-05-02',
    vehicle: 'Renault Master - AB-123-CD',
    driver: 'Pierre Rousseau',
    status: anomalyStatus,
    expectedConsumption: 42.5,
    actualConsumption: 48.8,
    consumptionDifference: 14.8,
    distanceGps: 245.3,
    distanceOdometer: 241.8,
    odometerDifference: 1.4,
  };

  const timelineEvents: TimelineEvent[] = [
    {
      id: '1',
      timestamp: '2026-05-02 08:30',
      title: 'Plein de carburant',
      description: 'Carburant: 65L à la station Elf de Lyon',
      type: 'fill',
    },
    {
      id: '2',
      timestamp: '2026-05-02 09:15',
      title: 'Début du trajet',
      description: 'Départ de Lyon vers Marseille',
      type: 'gps',
    },
    {
      id: '3',
      timestamp: '2026-05-02 14:45',
      title: 'Arrêt intermédiaire',
      description: 'Arrêt à Valence pendant 30 minutes',
      type: 'gps',
    },
    {
      id: '4',
      timestamp: '2026-05-02 18:30',
      title: 'Fin du trajet',
      description: 'Arrivée à Marseille. Distance: 245.3km',
      type: 'gps',
    },
    {
      id: '5',
      timestamp: '2026-05-02 19:00',
      title: 'Vidange carburant',
      description: 'Carburant consommé: 48.8L (écart +14.8%)',
      type: 'consumption',
    },
  ];

  const relatedTransactions: RelatedTransaction[] = [
    {
      id: '1',
      date: '2026-05-02',
      type: 'ravitaillement',
      amount: 97.5,
      volume: 65,
      location: 'Station Elf, Lyon',
    },
    {
      id: '2',
      date: '2026-04-28',
      type: 'vidange',
      amount: 45.2,
      location: 'Garage Renault, Lyon',
    },
    {
      id: '3',
      date: '2026-04-15',
      type: 'carburant',
      amount: 105.3,
      volume: 72,
      location: 'Station Total, Villeurbanne',
    },
  ];

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: String(comments.length + 1),
      author: 'Administrateur',
      timestamp: new Date().toLocaleString('fr-FR'),
      text: newComment,
    };

    setComments([...comments, comment]);
    setNewComment('');
  };

  const handleConfirmAnomaly = () => {
    setAnomalyStatus('confirmed');
  };

  const handleFalsePositive = () => {
    setAnomalyStatus('false_positive');
  };

  const handleCreateReport = () => {
    console.log('Creating report for anomaly:', anomaly.id);
  };

  const getTypeLabel = (type: AnomalyType): string => {
    const labels: Record<AnomalyType, string> = {
      surconsommation: 'Surconsommation',
      vol_carburant: 'Vol potentiel',
      plein_suspect: 'Plein suspect',
      écart_kilométrique: 'Écart kilométrique',
    };
    return labels[type];
  };

  const getSeverityColor = (severity: SeverityLevel) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-300';
    }
  };

  const getSeverityLabel = (severity: SeverityLevel): string => {
    const labels: Record<SeverityLevel, string> = {
      critical: 'Critique',
      high: 'Élevée',
      medium: 'Moyenne',
      low: 'Faible',
    };
    return labels[severity];
  };

  const getStatusColor = (status: AnomalyStatus) => {
    switch (status) {
      case 'detected':
        return 'bg-blue-100 text-blue-700';
      case 'investigating':
        return 'bg-purple-100 text-purple-700';
      case 'confirmed':
        return 'bg-red-100 text-red-700';
      case 'false_positive':
        return 'bg-green-100 text-green-700';
      case 'resolved':
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: AnomalyStatus): string => {
    const labels: Record<AnomalyStatus, string> = {
      detected: 'Détectée',
      investigating: 'Investigation',
      confirmed: 'Confirmée',
      false_positive: 'Faux positif',
      resolved: 'Résolue',
    };
    return labels[status];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Anomalie carburant {anomaly.id}
                </h1>
                <p className="text-gray-600 mt-1">
                  {getTypeLabel(anomaly.type)} détectée le {anomaly.date}
                </p>
              </div>
            </div>
            <span className={`inline-block px-4 py-2 rounded-lg font-medium ${getStatusColor(anomaly.status)}`}>
              {getStatusLabel(anomaly.status)}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Anomaly Info Card */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
            {/* Left Column */}
            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium text-gray-600">Type d'anomalie</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {getTypeLabel(anomaly.type)}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600">Gravité</p>
                <div className="mt-2">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getSeverityColor(anomaly.severity)}`}>
                    {getSeverityLabel(anomaly.severity)}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600">Véhicule</p>
                <div className="flex items-center gap-2 mt-2 text-gray-900 font-medium">
                  <Truck className="h-5 w-5 text-blue-600" />
                  {anomaly.vehicle}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600">Chauffeur</p>
                <div className="flex items-center gap-2 mt-2 text-gray-900 font-medium">
                  <User className="h-5 w-5 text-green-600" />
                  {anomaly.driver}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200">
                <p className="text-sm font-medium text-gray-600 mb-3">
                  Consommation
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Attendue</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {anomaly.expectedConsumption.toFixed(1)}L
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Réelle</span>
                    <span className="text-lg font-semibold text-red-600">
                      {anomaly.actualConsumption.toFixed(1)}L
                    </span>
                  </div>
                  <div className="border-t border-orange-200 pt-2 flex items-center justify-between">
                    <span className="text-gray-700 font-medium">Écart</span>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-red-600" />
                      <span className="text-lg font-bold text-red-600">
                        +{anomaly.consumptionDifference.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm font-medium text-gray-600 mb-3">
                  Distance
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">GPS</span>
                    <span className="font-semibold text-gray-900">
                      {anomaly.distanceGps.toFixed(1)}km
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Odomètre</span>
                    <span className="font-semibold text-gray-900">
                      {anomaly.distanceOdometer.toFixed(1)}km
                    </span>
                  </div>
                  <div className="border-t border-blue-200 pt-2 flex items-center justify-between">
                    <span className="text-gray-700 font-medium">Écart</span>
                    <span className="font-semibold text-blue-600">
                      {anomaly.odometerDifference.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6">
            Chronologie des événements
          </h2>

          <div className="space-y-4">
            {timelineEvents.map((event, idx) => (
              <div key={event.id} className="flex gap-6">
                {/* Timeline Line */}
                <div className="flex flex-col items-center">
                  <div className={`w-4 h-4 rounded-full ${
                    event.type === 'fill'
                      ? 'bg-green-500'
                      : event.type === 'consumption'
                        ? 'bg-red-500'
                        : 'bg-blue-500'
                  }`} />
                  {idx < timelineEvents.length - 1 && (
                    <div className="w-0.5 h-16 bg-gray-200 my-2" />
                  )}
                </div>

                {/* Event Content */}
                <div className="pb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600">
                      {event.timestamp}
                    </span>
                    <h4 className="font-semibold text-gray-900">
                      {event.title}
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {event.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Consumption Comparison */}
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6">
            Consommation: Attendue vs Réelle
          </h2>

          <div className="flex items-end justify-center gap-12">
            {/* Expected */}
            <div className="text-center">
              <div className="flex items-end justify-center h-48 gap-2 mb-4">
                <div className="w-24 bg-green-100 rounded-t-lg flex items-end justify-center text-center">
                  <div className="pb-4">
                    <span className="text-2xl font-bold text-green-700">
                      {anomaly.expectedConsumption.toFixed(1)}L
                    </span>
                  </div>
                </div>
              </div>
              <p className="font-medium text-gray-900">Attendue</p>
            </div>

            {/* Actual */}
            <div className="text-center">
              <div className="flex items-end justify-center h-64 gap-2 mb-4">
                <div className="w-24 bg-red-200 rounded-t-lg flex items-end justify-center text-center">
                  <div className="pb-4">
                    <span className="text-2xl font-bold text-red-700">
                      {anomaly.actualConsumption.toFixed(1)}L
                    </span>
                  </div>
                </div>
              </div>
              <p className="font-medium text-gray-900">Réelle</p>
            </div>
          </div>
        </div>

        {/* Map Placeholder */}
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6">
            Tracé du trajet
          </h2>
          <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center border-2 border-dashed border-gray-300">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">
                Carte interactive du trajet
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Lyon → Valence → Marseille (245.3km)
              </p>
            </div>
          </div>
        </div>

        {/* Related Transactions */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-8 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">
              Transactions associées
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {relatedTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="p-6 hover:bg-gray-50 transition flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {transaction.type === 'ravitaillement'
                      ? 'Ravitaillement'
                      : transaction.type === 'vidange'
                        ? 'Vidange'
                        : 'Carburant'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {transaction.location} • {transaction.date}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {transaction.amount.toFixed(2)}€
                  </p>
                  {transaction.volume && (
                    <p className="text-sm text-gray-600">
                      {transaction.volume}L
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6">
            Actions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={handleConfirmAnomaly}
              disabled={anomaly.status === 'confirmed'}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <CheckCircle2 className="h-5 w-5" />
              Confirmer l'anomalie
            </button>

            <button
              onClick={handleFalsePositive}
              disabled={anomaly.status === 'false_positive'}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <XCircle className="h-5 w-5" />
              Faux positif
            </button>

            <button
              onClick={handleCreateReport}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
            >
              <Flag className="h-5 w-5" />
              Créer un signalement
            </button>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Commentaires et notes
          </h2>

          {/* Existing Comments */}
          <div className="space-y-6 mb-8">
            {comments.map((comment) => (
              <div key={comment.id} className="border-l-4 border-blue-500 pl-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {comment.author}
                    </p>
                    <p className="text-sm text-gray-600">
                      {comment.timestamp}
                    </p>
                  </div>
                </div>
                <p className="text-gray-700 mt-3">
                  {comment.text}
                </p>
              </div>
            ))}
          </div>

          {/* Add Comment */}
          <div className="border-t pt-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Ajouter un commentaire
            </label>
            <div className="space-y-3">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Décrivez vos observations..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Poster le commentaire
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
