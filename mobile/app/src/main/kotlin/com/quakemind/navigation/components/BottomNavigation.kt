package com.quakemind.navigation.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.PhoneInTalk
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Inventory2
import androidx.compose.material.icons.outlined.LocationOn
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavDestination
import androidx.navigation.NavDestination.Companion.hasRoute
import com.quakemind.core.designsystem.AfetCrimson
import com.quakemind.core.designsystem.Zinc200
import com.quakemind.core.designsystem.Zinc600
import com.quakemind.navigation.AlertsRoute
import com.quakemind.navigation.ChecklistRoute
import com.quakemind.navigation.HomeRoute
import com.quakemind.navigation.MapRoute
import com.quakemind.navigation.SosRoute

data class BottomDestination(
    val label: String,
    val activeIcon: ImageVector,
    val inactiveIcon: ImageVector,
    val route: Any,
    val isSos: Boolean = false,
    val matches: (NavDestination?) -> Boolean,
)

private val STATIC_BOTTOM_DESTINATIONS: List<BottomDestination> = listOf(
    BottomDestination(
        label = "Ana Sayfa",
        activeIcon = Icons.Filled.Home,
        inactiveIcon = Icons.Outlined.Home,
        route = HomeRoute,
    ) { it?.hasRoute<HomeRoute>() == true },
    BottomDestination(
        label = "Harita",
        activeIcon = Icons.Filled.LocationOn,
        inactiveIcon = Icons.Outlined.LocationOn,
        route = MapRoute(),
    ) { it?.hasRoute<MapRoute>() == true },
    BottomDestination(
        label = "SOS",
        activeIcon = Icons.Filled.PhoneInTalk,
        inactiveIcon = Icons.Filled.PhoneInTalk,
        route = SosRoute,
        isSos = true,
    ) { it?.hasRoute<SosRoute>() == true },
    BottomDestination(
        label = "Uyarılar",
        activeIcon = Icons.Filled.Notifications,
        inactiveIcon = Icons.Outlined.Notifications,
        route = AlertsRoute,
    ) { it?.hasRoute<AlertsRoute>() == true },
    BottomDestination(
        label = "Çanta",
        activeIcon = Icons.Filled.Inventory2,
        inactiveIcon = Icons.Outlined.Inventory2,
        route = ChecklistRoute,
    ) { it?.hasRoute<ChecklistRoute>() == true },
)

fun defaultBottomDestinations(): List<BottomDestination> = STATIC_BOTTOM_DESTINATIONS

private val SosRedGradient = Brush.verticalGradient(
    colors = listOf(
        Color(0xFFA61C1C),
        Color(0xFF6E0C0C),
    )
)

private val ShapeTop20dp = RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp)
private val BorderBottomBar = BorderStroke(1.dp, Zinc200.copy(alpha = 0.7f))
private val BorderSosButton = BorderStroke(3.5.dp, Color.White)

@Composable
fun SolidPureWhiteBottomNavBar(
    items: List<BottomDestination>,
    destination: NavDestination?,
    onNavigate: (Any) -> Unit,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier.fillMaxWidth(),
        contentAlignment = Alignment.BottomCenter,
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .shadow(
                    elevation = 6.dp,
                    shape = ShapeTop20dp,
                    ambientColor = Color.Black.copy(alpha = 0.05f),
                    spotColor = Color.Black.copy(alpha = 0.10f),
                ),
            shape = ShapeTop20dp,
            color = Color.White,
            border = BorderBottomBar,
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .navigationBarsPadding()
                    .height(56.dp)
                    .padding(start = 8.dp, end = 8.dp, top = 8.dp, bottom = 4.dp),
                horizontalArrangement = Arrangement.SpaceAround,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                items.forEach { item ->
                    if (item.isSos) {
                        Spacer(modifier = Modifier.weight(1f))
                    } else {
                        val selected = item.matches(destination)
                        BottomNavItemView(
                            item = item,
                            selected = selected,
                            onNavigate = onNavigate,
                            modifier = Modifier.weight(1f),
                        )
                    }
                }
            }
        }

        val sosItem = items.find { it.isSos }
        if (sosItem != null) {
            SosFloatingButton(
                item = sosItem,
                onNavigate = onNavigate,
                modifier = Modifier
                    .navigationBarsPadding()
                    .padding(bottom = 6.dp),
            )
        }
    }
}

@Composable
private fun SosFloatingButton(
    item: BottomDestination,
    onNavigate: (Any) -> Unit,
    modifier: Modifier = Modifier,
) {
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()

    val buttonScale by animateFloatAsState(
        targetValue = if (isPressed) 0.90f else 1.0f,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioMediumBouncy,
            stiffness = Spring.StiffnessMedium,
        ),
        label = "sosScaleAnim",
    )

    Box(
        modifier = modifier
            .testTag("bottom_nav_sos")
            .graphicsLayer {
                scaleX = buttonScale
                scaleY = buttonScale
            }
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                onClick = { onNavigate(item.route) }
            ),
        contentAlignment = Alignment.Center,
    ) {
        Surface(
            modifier = Modifier.size(64.dp),
            shape = CircleShape,
            color = Color.Transparent,
            border = BorderSosButton,
            shadowElevation = 8.dp,
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(SosRedGradient, CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center,
                ) {
                    Icon(
                        imageVector = Icons.Filled.PhoneInTalk,
                        contentDescription = "SOS",
                        tint = Color.White,
                        modifier = Modifier.size(23.dp),
                    )
                    Spacer(Modifier.height(1.dp))
                    Text(
                        text = "SOS",
                        color = Color.White,
                        fontWeight = FontWeight.Black,
                        fontSize = 11.5.sp,
                        letterSpacing = 0.8.sp,
                    )
                }
            }
        }
    }
}

@Composable
private fun BottomNavItemView(
    item: BottomDestination,
    selected: Boolean,
    onNavigate: (Any) -> Unit,
    modifier: Modifier = Modifier,
) {
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()

    val buttonScale by animateFloatAsState(
        targetValue = if (isPressed) 0.92f else 1.0f,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioMediumBouncy,
            stiffness = Spring.StiffnessMedium,
        ),
        label = "scaleAnim",
    )

    val contentColor by animateColorAsState(
        targetValue = if (selected) AfetCrimson else Zinc600,
        label = "colorAnim",
    )
    val icon = if (selected) item.activeIcon else item.inactiveIcon
    val tabTag = "bottom_nav_" + when (item.label) {
        "Ana Sayfa" -> "home"
        "Harita" -> "map"
        "Uyarılar" -> "alerts"
        "Çanta" -> "checklist"
        else -> item.label.lowercase().replace(" ", "_")
    }

    Box(
        modifier = modifier
            .fillMaxHeight()
            .testTag(tabTag)
            .graphicsLayer {
                scaleX = buttonScale
                scaleY = buttonScale
            }
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                onClick = { onNavigate(item.route) }
            ),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.padding(top = 2.dp),
        ) {
            Icon(
                imageVector = icon,
                contentDescription = item.label,
                modifier = Modifier.size(22.dp),
                tint = contentColor,
            )
            Spacer(Modifier.height(2.dp))
            Text(
                text = item.label,
                fontSize = 10.5.sp,
                color = contentColor,
                fontWeight = if (selected) FontWeight.Bold else FontWeight.SemiBold,
                maxLines = 1,
            )
        }
    }
}
