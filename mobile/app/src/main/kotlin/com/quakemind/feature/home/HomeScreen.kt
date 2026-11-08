package com.quakemind.feature.home

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.ChevronRight
import androidx.compose.material.icons.outlined.Directions
import androidx.compose.material.icons.outlined.Inventory2
import androidx.compose.material.icons.outlined.KeyboardArrowDown
import androidx.compose.material.icons.outlined.LocationOn
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material.icons.outlined.Warning
import com.quakemind.core.model.AlertSeverity
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Report
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.quakemind.core.designsystem.*
import com.quakemind.core.model.Alert
import com.quakemind.core.model.Earthquake
import com.quakemind.core.ui.state.AppUiState

@Composable
fun HomeScreen(
    state: AppUiState,
    onMap: () -> Unit,
    onReport: () -> Unit,
    onSos: () -> Unit,
    onSafety: () -> Unit,
    onAlerts: () -> Unit,
    onRouting: () -> Unit,
    onDamage: () -> Unit,
    onNlp: () -> Unit,
    onRisk: () -> Unit,
    onChecklist: () -> Unit,
    onOperations: () -> Unit,
    onProfile: () -> Unit,
    onIncident: (String) -> Unit,
) {
    HomeScreen(
        state = HomeUiState(
            session = state.session,
            earthquakes = state.earthquakes,
            alerts = state.alerts,
            pendingCount = state.pendingCount,
            online = state.online,
        ),
        onMap = onMap,
        onReport = onReport,
        onSos = onSos,
        onSafety = onSafety,
        onAlerts = onAlerts,
        onRouting = onRouting,
        onDamage = onDamage,
        onNlp = onNlp,
        onRisk = onRisk,
        onChecklist = onChecklist,
        onOperations = onOperations,
        onProfile = onProfile,
        onIncident = onIncident,
    )
}

private val EARTHQUAKE_FILTERS = listOf("Tümü", "M ≥ 4.0", "M ≥ 3.5", "Yakındakiler")

@Composable
fun HomeScreen(
    state: HomeUiState,
    onMap: () -> Unit,
    onReport: () -> Unit,
    onSos: () -> Unit,
    onSafety: () -> Unit,
    onAlerts: () -> Unit,
    onRouting: () -> Unit,
    onDamage: () -> Unit,
    onNlp: () -> Unit,
    onRisk: () -> Unit,
    onChecklist: () -> Unit,
    onOperations: () -> Unit,
    onProfile: () -> Unit,
    onIncident: (String) -> Unit,
) {
    val listState = rememberLazyListState()
    val latestEarthquake = remember(state.earthquakes) { state.earthquakes.firstOrNull() }
    var earthquakeFilter by rememberSaveable { mutableStateOf("Tümü") }
    val filteredEarthquakes = remember(earthquakeFilter, state.earthquakes) {
        when (earthquakeFilter) {
            "M ≥ 4.0" -> state.earthquakes.filter { it.magnitude >= 4.0 }
            "M ≥ 3.5" -> state.earthquakes.filter { it.magnitude >= 3.5 }
            "Yakındakiler" -> state.earthquakes.filter { it.distanceKm <= 350 }
            else -> state.earthquakes
        }
    }
    val hasUnreadAlerts = remember(state.alerts) { state.alerts.any { !it.isRead } }
    val recentAlerts = remember(state.alerts) { state.alerts.take(2) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.White)
            .testTag("home_lazy_column"),
        state = listState,
        contentPadding = PaddingValues(bottom = 110.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {

        // 1. ULTRA-MODERN SHADCN APP HEADER (Clean Logo + Profile Icon + Notifications)
        item(key = "home_app_header", contentType = "header") {
            ModernAppHeader(
                userName = state.session?.displayName ?: "Kullanıcı",
                hasUnreadAlerts = hasUnreadAlerts,
                onAlerts = onAlerts,
                onProfile = onProfile,
            )
        }

        // 2. OFFLINE QUEUE BANNER (IF ANY)
        if (!state.online || state.pendingCount > 0) {
            item(key = "home_offline_banner", contentType = "banner") {
                Box(Modifier.padding(horizontal = 18.dp)) {
                    OfflineModeBanner(pendingCount = state.pendingCount)
                }
            }
        }

        // 3. LOCATION BAR (PLACED DIRECTLY ABOVE LATEST EARTHQUAKE CARD)
        item(key = "home_location_bar", contentType = "location_bar") {
            LocationContextBar(
                city = state.session?.city?.takeIf { it.isNotBlank() } ?: "Bölge bilgisi yok",
                stationName = latestEarthquake?.source?.takeIf { it.isNotBlank() }
                    ?: "Deprem kaynağı bekleniyor",
            )
        }

        // 4. LATEST EARTHQUAKE HERO (#800E13 Crimson typography, clean editorial aesthetic)
        if (latestEarthquake != null) {
            item(key = "home_latest_earthquake", contentType = "hero") {
                Box(Modifier.padding(horizontal = 18.dp)) {
                    ElegantEarthquakeHero(
                        earthquake = latestEarthquake,
                        onMap = onMap,
                        onRisk = onRisk,
                    )
                }
            }
        }

        // 5. REGIONAL ALERTS (PLACED DIRECTLY UNDER LATEST EARTHQUAKE CARD)
        if (recentAlerts.isNotEmpty()) {
            item(key = "home_regional_alerts", contentType = "regional_alerts") {
                Box(Modifier.padding(horizontal = 18.dp)) {
                    RegionalAlertsSection(
                        alerts = recentAlerts,
                        onAlerts = onAlerts,
                        onSelectAlert = onIncident,
                    )
                }
            }
        }

        // 6. QUICK ACTIONS 2x2 GRID
        item(key = "home_quick_actions", contentType = "quick_actions") {
            Box(Modifier.padding(horizontal = 18.dp)) {
                HomeQuickActionsGrid(
                    onReport = onReport,
                    onSafety = onSafety,
                    onRouting = onRouting,
                    onChecklist = onChecklist,
                )
            }
        }

        // 7. LIVE EARTHQUAKE LIST HEADER WITH TABS
        item(key = "home_earthquakes_section_header", contentType = "earthquakes_header") {
            EarthquakeFilterSection(
                selectedFilter = earthquakeFilter,
                onSelectFilter = { earthquakeFilter = it },
                onMap = onMap,
            )
        }

        // 8. LIVE EARTHQUAKE LAZY ROWS (Lazy recycled items with stable ID key)
        items(
            items = filteredEarthquakes,
            key = { it.id },
            contentType = { "earthquake_row" },
        ) { eq ->
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 18.dp),
            ) {
                HomeEarthquakeRow(earthquake = eq, onClick = onMap)
            }
        }

        // 9. AI TOOLS MINIMALIST CARD
        item(key = "home_ai_tools", contentType = "ai_tools") {
            Box(Modifier.padding(horizontal = 18.dp)) {
                HomeAiToolsCard(
                    onDamage = onDamage,
                    onNlp = onNlp,
                )
            }
        }
    }
}

@Composable
private fun EarthquakeFilterSection(
    selectedFilter: String,
    onSelectFilter: (String) -> Unit,
    onMap: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 18.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column {
                Text(
                    text = "Son Depremler",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = Zinc950,
                )
                Text(
                    text = "Doğrulanmış resmi kayıtlar",
                    fontSize = 12.sp,
                    color = Zinc500,
                )
            }
            TextButton(onClick = onMap) {
                Text("Tümü ↗", fontSize = 12.5.sp, fontWeight = FontWeight.SemiBold, color = AfetCrimson)
            }
        }

        // Filter chips
        LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            items(
                items = EARTHQUAKE_FILTERS,
                key = { it },
                contentType = { "filter_chip" },
            ) { filter ->
                FilterChip(
                    selected = selectedFilter == filter,
                    onClick = { onSelectFilter(filter) },
                    label = { Text(filter, fontSize = 12.sp, fontWeight = FontWeight.Medium) },
                    shape = RoundedCornerShape(6.dp),
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = AfetCrimson,
                        selectedLabelColor = Color.White,
                        containerColor = Zinc50,
                        labelColor = Zinc700,
                    ),
                    border = FilterChipDefaults.filterChipBorder(
                        enabled = true,
                        selected = selectedFilter == filter,
                        borderColor = Zinc200,
                        selectedBorderColor = AfetCrimson,
                    ),
                )
            }
        }
    }
}

// ---------------------------------------------------------------------------
// 1. ULTRA-MODERN APP HEADER (Clean Logo + Profile Icon + Notifications)
// ---------------------------------------------------------------------------

@Composable
private fun ModernAppHeader(
    userName: String,
    hasUnreadAlerts: Boolean,
    onAlerts: () -> Unit,
    onProfile: () -> Unit,
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = Color.White,
        border = BorderZinc100,
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .padding(horizontal = 18.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            // Left: Geometric Brand Logo Mark
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                AfetLogoMark(size = 32.dp, color = AfetCrimson)
                Column {
                    Text(
                        text = "AFET",
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Black,
                        color = Zinc950,
                        letterSpacing = 1.5.sp,
                    )
                    Text(
                        text = "Acil Destek Ağı",
                        fontSize = 10.5.sp,
                        fontWeight = FontWeight.Medium,
                        color = Zinc400,
                    )
                }
            }

            // Right: Clean Outline Action Buttons (Notifications + Profile Icon)
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                // Notifications Bell
                Surface(
                    modifier = Modifier
                        .size(38.dp)
                        .clickable(onClick = onAlerts),
                    shape = Shape9dp,
                    color = Color.White,
                    border = BorderZinc200,
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            Icons.Outlined.Notifications,
                            contentDescription = "Bildirimler",
                            tint = Zinc800,
                            modifier = Modifier.size(19.dp),
                        )
                        if (hasUnreadAlerts) {
                            Box(
                                Modifier
                                    .align(Alignment.TopEnd)
                                    .padding(7.dp)
                                    .size(6.dp)
                                    .clip(CircleShape)
                                    .background(AfetCrimson),
                            )
                        }
                    }
                }

                // Profile Avatar Icon Button
                Surface(
                    modifier = Modifier
                        .size(38.dp)
                        .clickable(onClick = onProfile),
                    shape = Shape9dp,
                    color = Zinc50,
                    border = BorderZinc200,
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            Icons.Outlined.Person,
                            contentDescription = "Profil",
                            tint = Zinc900,
                            modifier = Modifier.size(20.dp),
                        )
                    }
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// 2. LOCATION BAR (Above Son Deprem)
// ---------------------------------------------------------------------------

@Composable
private fun LocationContextBar(
    city: String,
    stationName: String,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 18.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Icon(
                Icons.Outlined.LocationOn,
                contentDescription = null,
                tint = AfetCrimson,
                modifier = Modifier.size(16.dp),
            )
            Text(
                text = city,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = Zinc950,
            )
            Icon(
                Icons.Outlined.KeyboardArrowDown,
                contentDescription = null,
                tint = Zinc400,
                modifier = Modifier.size(15.dp),
            )
        }

        Surface(
            shape = Shape6dp,
            color = Zinc50,
            border = BorderZinc200,
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(5.dp),
            ) {
                Box(Modifier.size(5.dp).background(AfetGreen, CircleShape))
                Text(
                    text = stationName,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Medium,
                    color = Zinc600,
                )
            }
        }
    }
}

// ---------------------------------------------------------------------------
// 3. ELEGANT EDITORIAL LATEST EARTHQUAKE HERO
// ---------------------------------------------------------------------------

@Composable
private fun ElegantEarthquakeHero(
    earthquake: Earthquake,
    onMap: () -> Unit,
    onRisk: () -> Unit,
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = Shape12dp,
        color = Color.White,
        border = BorderZinc200,
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            // Header Row: Label + Source
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = "SON DEPREM BİLGİSİ",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = Zinc500,
                    letterSpacing = 1.sp,
                )
                Text(
                    text = earthquake.source,
                    fontSize = 11.5.sp,
                    color = Zinc400,
                    fontWeight = FontWeight.Medium,
                )
            }

            // Main Typographic Section: Large Magnitude + Epicenter
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                // Large Elegant Magnitude (#800E13)
                Text(
                    text = earthquake.magnitude.formatMagnitude(),
                    fontSize = 42.sp,
                    fontWeight = FontWeight.Black,
                    color = AfetCrimson,
                    letterSpacing = (-1).sp,
                )

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = earthquake.epicenter,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = Zinc950,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                    Spacer(Modifier.height(3.dp))
                    Text(
                        text = "Derinlik: ${earthquake.depthKm} km · ${earthquake.distanceKm} km uzakta",
                        fontSize = 12.5.sp,
                        color = Zinc500,
                    )
                    Text(
                        text = "${earthquake.occurredAt} · ${earthquake.feltCount} kişi hissetti",
                        fontSize = 11.5.sp,
                        color = Zinc400,
                    )
                }
            }

            HorizontalDivider(color = Zinc100)

            // Actions: Simple, refined buttons
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedButton(
                    onClick = onMap,
                    modifier = Modifier
                        .weight(1f)
                        .height(38.dp),
                    shape = Shape8dp,
                    border = BorderZinc200,
                ) {
                    Text("Haritada Göster", fontSize = 12.5.sp, fontWeight = FontWeight.Medium, color = Zinc900)
                }

                Button(
                    onClick = onRisk,
                    modifier = Modifier
                        .weight(1f)
                        .height(38.dp),
                    shape = Shape8dp,
                    colors = ButtonDefaults.buttonColors(containerColor = AfetCrimson),
                ) {
                    Text("Zemin Analizi", fontSize = 12.5.sp, fontWeight = FontWeight.Medium)
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// 4. REGIONAL ALERTS SECTION (Placed directly below Son Deprem)
// ---------------------------------------------------------------------------

@Composable
private fun RegionalAlertsSection(
    alerts: List<Alert>,
    onAlerts: () -> Unit,
    onSelectAlert: (String) -> Unit,
) {
    val configuration = LocalConfiguration.current
    val screenHeight = configuration.screenHeightDp.dp
    // Responsive bounded max height to guarantee 4-button quick actions remain above Tab Bar on all screens
    val maxAlertsHeight = (screenHeight - 570.dp).coerceIn(84.dp, 210.dp)
    val hasCritical = alerts.any { it.severity == AlertSeverity.CRITICAL }
    val alertsScrollState = rememberScrollState()

    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(max = maxAlertsHeight),
        shape = Shape12dp,
        color = Color.White,
        border = if (hasCritical) BorderAfetCrimsonBorder else BorderZinc200,
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
        ) {
            // Header Row: Status Icon + Title + Count Pill + All Action Button
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Surface(
                        shape = Shape6dp,
                        color = if (hasCritical) AfetCrimsonMuted else Zinc100,
                        border = if (hasCritical) BorderAfetCrimsonBorder else BorderZinc200,
                        modifier = Modifier.size(26.dp),
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = if (hasCritical) Icons.Outlined.Warning else Icons.Outlined.Notifications,
                                contentDescription = null,
                                tint = if (hasCritical) AfetCrimson else Zinc700,
                                modifier = Modifier.size(15.dp),
                            )
                        }
                    }

                    Text(
                        text = "Bölgesel Uyarılar",
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.5.sp,
                        color = Zinc950,
                    )

                    Surface(
                        shape = Shape4dp,
                        color = if (hasCritical) AfetCrimsonMuted else Zinc100,
                        border = if (hasCritical) BorderAfetCrimsonBorder else BorderZinc200,
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp),
                        ) {
                            Box(
                                Modifier
                                    .size(5.dp)
                                    .background(if (hasCritical) AfetCrimson else Zinc500, CircleShape)
                            )
                            Text(
                                text = "${alerts.size} Aktif",
                                fontSize = 10.5.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = if (hasCritical) AfetCrimson else Zinc600,
                            )
                        }
                    }
                }

                Row(
                    modifier = Modifier
                        .clip(Shape6dp)
                        .clickable(onClick = onAlerts)
                        .padding(horizontal = 6.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(2.dp),
                ) {
                    Text(
                        text = "Tümü",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = AfetCrimson,
                    )
                    Icon(
                        imageVector = Icons.Outlined.ChevronRight,
                        contentDescription = "Tümü",
                        tint = AfetCrimson,
                        modifier = Modifier.size(14.dp),
                    )
                }
            }

            Spacer(Modifier.height(8.dp))

            // Scrollable Alerts List if content exceeds responsive bounded height
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f, fill = false)
                    .verticalScroll(alertsScrollState),
            ) {
                alerts.forEachIndexed { index, alert ->
                    if (index > 0) {
                        HorizontalDivider(
                            color = Zinc100,
                            modifier = Modifier.padding(vertical = 6.dp),
                        )
                    }

                    val (badgeBg, badgeText, badgeBorder) = when (alert.severity) {
                        AlertSeverity.CRITICAL -> Triple(AfetCrimsonMuted, AfetCrimson, AfetCrimsonBorder)
                        AlertSeverity.WARNING -> Triple(AfetAmberMuted, AfetAmber, AfetAmberBorder)
                        AlertSeverity.INFO -> Triple(AfetBlueMuted, AfetBlue, AfetBlueBorder)
                    }

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(Shape8dp)
                            .clickable { onSelectAlert(alert.id) }
                            .padding(vertical = 3.dp, horizontal = 2.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        Column(
                            modifier = Modifier.weight(1f),
                            verticalArrangement = Arrangement.spacedBy(3.dp),
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                            ) {
                                Surface(
                                    shape = Shape4dp,
                                    color = badgeBg,
                                    border = androidx.compose.foundation.BorderStroke(1.dp, badgeBorder),
                                ) {
                                    Text(
                                        text = alert.category.uppercase(),
                                        fontSize = 9.5.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = badgeText,
                                        letterSpacing = 0.4.sp,
                                        modifier = Modifier.padding(horizontal = 5.dp, vertical = 1.5.dp),
                                    )
                                }

                                Text(
                                    text = "·",
                                    fontSize = 12.sp,
                                    color = Zinc300,
                                    fontWeight = FontWeight.Bold,
                                )

                                Text(
                                    text = alert.occurredAt,
                                    fontSize = 11.sp,
                                    color = Zinc400,
                                )
                            }

                            Text(
                                text = alert.title,
                                fontSize = 12.5.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = Zinc900,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                            )

                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(3.dp),
                            ) {
                                Icon(
                                    imageVector = Icons.Outlined.LocationOn,
                                    contentDescription = null,
                                    tint = Zinc400,
                                    modifier = Modifier.size(11.dp),
                                )
                                Text(
                                    text = alert.location,
                                    fontSize = 11.sp,
                                    color = Zinc500,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                )
                            }
                        }

                        Icon(
                            imageVector = Icons.Outlined.ChevronRight,
                            contentDescription = "Detay",
                            tint = Zinc400,
                            modifier = Modifier.size(16.dp),
                        )
                    }
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// 5. QUICK ACTIONS GRID
// ---------------------------------------------------------------------------

@Composable
private fun HomeQuickActionsGrid(
    onReport: () -> Unit,
    onSafety: () -> Unit,
    onRouting: () -> Unit,
    onChecklist: () -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            QuickActionTile(
                title = "Acil İhbar Bildir",
                subtitle = "Enkaz, yangın, hasar",
                icon = Icons.Outlined.Report,
                onClick = onReport,
                modifier = Modifier.weight(1f),
            )
            QuickActionTile(
                title = "Güvendeyim",
                subtitle = "Aile ağına bildir",
                icon = Icons.Outlined.CheckCircle,
                onClick = onSafety,
                modifier = Modifier.weight(1f),
            )
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            QuickActionTile(
                title = "Toplanma Alanı",
                subtitle = "Güvenli tahliye rotası",
                icon = Icons.Outlined.Directions,
                onClick = onRouting,
                modifier = Modifier.weight(1f),
            )
            QuickActionTile(
                title = "Afet Çantası",
                subtitle = "Hazırlık kontrol listesi",
                icon = Icons.Outlined.Inventory2,
                onClick = onChecklist,
                modifier = Modifier.weight(1f),
            )
        }
    }
}

@Composable
private fun QuickActionTile(
    title: String,
    subtitle: String,
    icon: ImageVector,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Surface(
        modifier = modifier
            .height(76.dp)
            .clickable(onClick = onClick),
        shape = Shape12dp,
        color = Color.White,
        border = BorderZinc200,
    ) {
        Row(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 12.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Surface(
                modifier = Modifier.size(36.dp),
                shape = Shape8dp,
                color = AfetCrimsonMuted,
                border = BorderAfetCrimsonBorder,
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = icon,
                        contentDescription = null,
                        tint = AfetCrimson,
                        modifier = Modifier.size(19.dp),
                    )
                }
            }

            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.Center,
            ) {
                Text(
                    text = title,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.5.sp,
                    color = Zinc950,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    letterSpacing = (-0.2).sp,
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = subtitle,
                    fontSize = 10.5.sp,
                    color = Zinc500,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
        }
    }
}

@Composable
private fun HomeEarthquakeRow(
    earthquake: Earthquake,
    onClick: () -> Unit,
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = Shape8dp,
        color = Color.White,
        border = BorderZinc100,
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            SeismicMagnitudeBadge(magnitude = earthquake.magnitude, size = 44.dp)

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = earthquake.epicenter,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 13.5.sp,
                    color = Zinc950,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(
                    text = "${earthquake.distanceKm} km uzakta · Derinlik: ${earthquake.depthKm} km",
                    fontSize = 11.5.sp,
                    color = Zinc500,
                )
            }

            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = earthquake.occurredAt,
                    fontSize = 11.sp,
                    color = Zinc400,
                )
                Text(
                    text = earthquake.source.take(8),
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Medium,
                    color = Zinc500,
                )
            }
        }
    }
}

@Composable
private fun HomeAiToolsCard(
    onDamage: () -> Unit,
    onNlp: () -> Unit,
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = Shape10dp,
        color = Zinc950,
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = "Yapay Zekâ Hasar Analizi",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                )
                ShadcnBadge(
                    text = "v2.4",
                    backgroundColor = Color(0xFF27272A),
                    textColor = Color.White,
                    borderColor = Color(0xFF3F3F46),
                )
            }

            Text(
                text = "Fotoğraf yükleyerek bina çatlaklarını analiz edin veya acil yardım metnini otomatik ayrıştırın.",
                fontSize = 12.sp,
                color = Zinc400,
                lineHeight = 17.sp,
            )

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(
                    onClick = onDamage,
                    modifier = Modifier
                        .weight(1f)
                        .height(36.dp),
                    shape = Shape6dp,
                    colors = ButtonDefaults.buttonColors(containerColor = AfetCrimson, contentColor = Color.White),
                ) {
                    Text("Hasar Tespiti", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                }
                OutlinedButton(
                    onClick = onNlp,
                    modifier = Modifier
                        .weight(1f)
                        .height(36.dp),
                    shape = Shape6dp,
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF3F3F46)),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White),
                ) {
                    Text("Metin Ayrıştır", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                }
            }
        }
    }
}
