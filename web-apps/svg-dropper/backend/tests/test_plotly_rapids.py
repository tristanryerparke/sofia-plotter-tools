import plotly.graph_objects as go

# Sample G-code data (x, y coordinates)
regular_moves = [
    [(0, 0), (1, 1), (2, 2)],
    [(3, 1), (4, 2), (5, 3)]
]
travel_moves = [
    [(2, 2), (3, 1)],
    [(5, 3), (0, 0)]
]

fig = go.Figure()

# Add regular movements (always visible)
for i, move in enumerate(regular_moves):
    x, y = zip(*move)
    fig.add_trace(go.Scatter(x=x, y=y, mode='lines', line=dict(color='blue'), 
                             name='Regular Moves' if i == 0 else None,
                             legendgroup='Regular', showlegend=(i == 0)))

# Add travel movements (toggleable)
for i, move in enumerate(travel_moves):
    x, y = zip(*move)
    fig.add_trace(go.Scatter(x=x, y=y, mode='lines', line=dict(color='red'), 
                             name='Travel Lines' if i == 0 else None,
                             legendgroup='Travel', showlegend=(i == 0)))

fig.update_layout(
    updatemenus=[
        dict(
            type="buttons",
            direction="right",
            buttons=[
                dict(label="Show Travel", method="update", args=[{"visible": [True] * len(fig.data)}]),
                dict(label="Hide Travel", method="update", 
                     args=[{"visible": [i < len(regular_moves) for i in range(len(fig.data))]}]),
            ],
            pad={"r": 10, "t": 10},
            showactive=True,
            x=0.1,
            xanchor="left",
            y=1.1,
            yanchor="top"
        ),
    ]
)

fig.show()