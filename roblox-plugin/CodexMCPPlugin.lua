local HttpService = game:GetService("HttpService")
local Selection = game:GetService("Selection")

local toolbar = plugin:CreateToolbar("Codex MCP")
local connectButton = toolbar:CreateButton("Connect MCP", "Ping local MCP bridge", "")

local widgetInfo = DockWidgetPluginGuiInfo.new(
	Enum.InitialDockState.Right,
	true,
	false,
	360,
	220,
	300,
	180
)

local widget = plugin:CreateDockWidgetPluginGui("CodexMCPWidget", widgetInfo)
widget.Title = "Codex MCP"

local frame = Instance.new("Frame")
frame.Size = UDim2.fromScale(1, 1)
frame.Parent = widget

local statusLabel = Instance.new("TextLabel")
statusLabel.Size = UDim2.new(1, -16, 0, 24)
statusLabel.Position = UDim2.fromOffset(8, 8)
statusLabel.BackgroundTransparency = 1
statusLabel.TextXAlignment = Enum.TextXAlignment.Left
statusLabel.Text = "Status: idle"
statusLabel.Parent = frame

local logLabel = Instance.new("TextLabel")
logLabel.Size = UDim2.new(1, -16, 1, -48)
logLabel.Position = UDim2.fromOffset(8, 36)
logLabel.BackgroundTransparency = 1
logLabel.TextXAlignment = Enum.TextXAlignment.Left
logLabel.TextYAlignment = Enum.TextYAlignment.Top
logLabel.TextWrapped = true
logLabel.Text = "No operations yet"
logLabel.Parent = frame

local BRIDGE_URL = "http://127.0.0.1:8181"
local TOKEN = "change-me"

local function post(path, payload)
	local response = HttpService:RequestAsync({
		Url = BRIDGE_URL .. path,
		Method = "POST",
		Headers = {
			["Content-Type"] = "application/json",
			["x-codex-token"] = TOKEN,
		},
		Body = HttpService:JSONEncode(payload or {}),
	})

	if not response.Success then
		error("HTTP request failed: " .. tostring(response.StatusCode))
	end

	return HttpService:JSONDecode(response.Body)
end

local function getSelectionPaths()
	local paths = {}
	for _, inst in ipairs(Selection:Get()) do
		table.insert(paths, inst:GetFullName())
	end
	return paths
end

local function ping()
	statusLabel.Text = "Status: connecting..."
	local ok, result = pcall(function()
		return post("/plugin/ping", {})
	end)
	if ok and result.ok then
		statusLabel.Text = "Status: connected"
		logLabel.Text = "Ping OK at " .. os.date("%X")
	else
		statusLabel.Text = "Status: disconnected"
		logLabel.Text = "Ping failed: " .. tostring(result)
	end
end

local function readSelectionPreview()
	local selected = getSelectionPaths()
	if #selected == 0 then
		logLabel.Text = "Select one or more scripts first."
		return
	end
	local ok, result = pcall(function()
		return post("/plugin/read_selection", { selection = selected })
	end)
	if ok and result.ok then
		logLabel.Text = "Read " .. tostring(#result.data.scripts) .. " script(s)."
	else
		logLabel.Text = "Read failed: " .. tostring(result)
	end
end

connectButton.Click:Connect(function()
	widget.Enabled = not widget.Enabled
	ping()
	readSelectionPreview()
end)
