package com.quakemind.feature.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.quakemind.core.data.repository.AlertRepository
import com.quakemind.core.data.repository.EarthquakeRepository
import com.quakemind.core.data.repository.IncidentRepository
import com.quakemind.core.data.repository.SessionRepository
import com.quakemind.core.network.monitor.NetworkMonitor
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.stateIn
import javax.inject.Inject

@HiltViewModel
class HomeViewModel @Inject constructor(
    sessionRepository: SessionRepository,
    earthquakeRepository: EarthquakeRepository,
    alertRepository: AlertRepository,
    incidentRepository: IncidentRepository,
    networkMonitor: NetworkMonitor,
) : ViewModel() {

    private val feedFlow = combine(
        sessionRepository.session(),
        earthquakeRepository.earthquakes(),
        alertRepository.alerts(),
    ) { session, earthquakes, alerts ->
        Triple(session, earthquakes, alerts)
    }

    private val initialState = HomeUiState(
        session = sessionRepository.currentSession(),
        earthquakes = earthquakeRepository.currentEarthquakes(),
        alerts = alertRepository.currentAlerts(),
        pendingCount = 0,
        online = true,
    )

    val state: StateFlow<HomeUiState> = combine(
        feedFlow,
        incidentRepository.pendingCount().distinctUntilChanged(),
        networkMonitor.isOnline,
    ) { feed, pending, isOnline ->
        HomeUiState(
            session = feed.first,
            earthquakes = feed.second,
            alerts = feed.third,
            pendingCount = pending,
            online = isOnline,
        )
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), initialState)
}
