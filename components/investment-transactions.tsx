"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, TrendingDown, Plus, Filter, Download, Search, Edit, Trash2 } from "lucide-react"
import { formatINR } from "@/lib/utils"
import { useState } from "react"

interface Transaction {
  id: string
  date: string
  type: 'Buy' | 'Sell' | 'Dividend' | 'Interest' | 'Bonus'
  asset: string
  quantity: number
  price: number
  amount: number
  status: 'Completed' | 'Pending' | 'Failed'
  category: 'Equity' | 'Debt' | 'Commodity' | 'Crypto' | 'Real Estate' | 'Cash'
}

interface InvestmentTransactionsProps {
  transactions: Transaction[]
  onAddTransaction?: () => void
  onEditTransaction?: (transactionId: string) => void
  onDeleteTransaction?: (transactionId: string) => void
  onExport?: () => void
}

export function InvestmentTransactions({ 
  transactions, 
  onAddTransaction, 
  onEditTransaction,
  onDeleteTransaction,
  onExport 
}: InvestmentTransactionsProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [activeTab, setActiveTab] = useState<string>("all")

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.asset.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || transaction.type === filterType
    const matchesCategory = filterCategory === "all" || transaction.category === filterCategory
    
    // Apply tab filtering
    let matchesTab = true
    if (activeTab === "buy") {
      matchesTab = transaction.type === "Buy"
    } else if (activeTab === "sell") {
      matchesTab = transaction.type === "Sell"
    } else if (activeTab === "income") {
      matchesTab = transaction.type === "Dividend" || transaction.type === "Interest" || transaction.type === "Bonus"
    }
    
    return matchesSearch && matchesType && matchesCategory && matchesTab
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800'
      case 'Pending': return 'bg-yellow-100 text-yellow-800'
      case 'Failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Buy': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'Sell': return <TrendingDown className="h-4 w-4 text-red-600" />
      case 'Dividend': return <TrendingUp className="h-4 w-4 text-blue-600" />
      case 'Interest': return <TrendingUp className="h-4 w-4 text-purple-600" />
      case 'Bonus': return <TrendingUp className="h-4 w-4 text-orange-600" />
      default: return null
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      'Equity': 'bg-blue-100 text-blue-800',
      'Debt': 'bg-green-100 text-green-800',
      'Commodity': 'bg-yellow-100 text-yellow-800',
      'Crypto': 'bg-purple-100 text-purple-800',
      'Real Estate': 'bg-orange-100 text-orange-800',
      'Cash': 'bg-gray-100 text-gray-800'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Investment Transactions</CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button size="sm" onClick={onAddTransaction}>
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="buy">Buy</TabsTrigger>
            <TabsTrigger value="sell">Sell</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
          </TabsList>
          
          <div className="mt-4 space-y-4">
            {/* Filters */}
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Buy">Buy</SelectItem>
                  <SelectItem value="Sell">Sell</SelectItem>
                  <SelectItem value="Dividend">Dividend</SelectItem>
                  <SelectItem value="Interest">Interest</SelectItem>
                  <SelectItem value="Bonus">Bonus</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Equity">Equity</SelectItem>
                  <SelectItem value="Debt">Debt</SelectItem>
                  <SelectItem value="Commodity">Commodity</SelectItem>
                  <SelectItem value="Crypto">Crypto</SelectItem>
                  <SelectItem value="Real Estate">Real Estate</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Transactions Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {new Date(transaction.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(transaction.type)}
                          <span>{transaction.type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{transaction.asset}</TableCell>
                      <TableCell>{transaction.quantity.toLocaleString()}</TableCell>
                      <TableCell>{formatINR(transaction.price)}</TableCell>
                      <TableCell className="font-medium">
                        {formatINR(transaction.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(transaction.status)}>
                          {transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getCategoryColor(transaction.category)}>
                          {transaction.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditTransaction?.(transaction.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteTransaction?.(transaction.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredTransactions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No transactions found matching your criteria.
              </div>
            )}
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}
